import {
  domainError,
  fail,
  ok,
  sanitizeMetadata,
  type DomainError,
  type OperationContext,
  type Result,
} from "../../../../../packages/shared/src/core";
import type { FeedbackRepositoryPort } from "../../../../core/feedback/src/feedback-repository.port";
import { recordFeedbackEvent } from "../../../../core/feedback/src/use-cases/record-feedback-event";
import type { CallEventRepositoryPort } from "../../../voice-core/src/call-event-repository.port";
import { validateVoiceMetadataKeys } from "../../../voice-core/src/call-data-policy";
import { registerCallEvent } from "../../../voice-core/src/use-cases/register-call-event";
import type { PostCallResult } from "../post-call-result";
import type { PostCallWebhookEnvelope } from "../post-call-webhook-envelope";

export interface IngestPostCallResultInput {
  readonly context: OperationContext;
  readonly envelope: PostCallWebhookEnvelope;
  readonly result: PostCallResult;
  readonly eventRepository?: CallEventRepositoryPort;
  readonly feedbackRepository?: FeedbackRepositoryPort;
}

export async function ingestPostCallResult(
  input: IngestPostCallResultInput,
): Promise<Result<PostCallResult, DomainError>> {
  if (!input.envelope.signatureVerified) {
    return fail(domainError("forbidden", "post-call webhook signature is not verified"));
  }

  const envelopeMetadata = validateVoiceMetadataKeys(input.envelope.payloadMetadata);
  if (!envelopeMetadata.ok) {
    return fail(envelopeMetadata.error);
  }

  const resultMetadata = validateVoiceMetadataKeys(input.result.metadata);
  if (!resultMetadata.ok) {
    return fail(resultMetadata.error);
  }

  const sanitized: PostCallResult = {
    ...input.result,
    metadata: sanitizeMetadata(input.result.metadata),
  };

  if (input.eventRepository) {
    await registerCallEvent({
      context: input.context,
      repository: input.eventRepository,
      callId: sanitized.callId,
      type: "call.post_call_ingested",
      status: sanitized.status,
      metadata: sanitized.metadata,
    });
  }

  if (input.feedbackRepository) {
    await recordFeedbackEvent({
      context: input.context,
      repository: input.feedbackRepository,
      source: "system",
      resourceType: "post_call_result",
      resourceId: sanitized.callId,
      outcome: sanitized.status === "failed" ? "failed" : "resolved",
      metadata: sanitized.metadata,
    });
  }

  return ok(sanitized);
}
