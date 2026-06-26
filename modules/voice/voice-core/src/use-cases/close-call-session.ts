import {
  domainError,
  fail,
  ok,
  type DomainError,
  type OperationContext,
  type Result,
} from "../../../../../packages/shared/src/core";
import type { FeedbackRepositoryPort } from "../../../../core/feedback/src/feedback-repository.port";
import { recordFeedbackEvent } from "../../../../core/feedback/src/use-cases/record-feedback-event";
import type { CallId } from "../call-id";
import type { CallSession } from "../call-session";
import type { CallSessionRepositoryPort } from "../call-session-repository.port";
import type { CallStatus } from "../call-status";

export interface CloseCallSessionInput {
  readonly context: OperationContext;
  readonly repository: CallSessionRepositoryPort;
  readonly callId: CallId;
  readonly status: Extract<CallStatus, "completed" | "failed" | "cancelled" | "handoff">;
  readonly feedbackRepository?: FeedbackRepositoryPort;
}

export async function closeCallSession(
  input: CloseCallSessionInput,
): Promise<Result<CallSession, DomainError>> {
  const session = await input.repository.findById(input.context.tenantId, input.callId);
  if (!session) {
    return fail(domainError("not_found", "call session not found"));
  }

  const updated: CallSession = {
    ...session,
    status: input.status,
    endedAt: input.context.occurredAt,
    updatedAt: input.context.occurredAt,
  };
  await input.repository.save(updated);

  if (input.feedbackRepository) {
    await recordFeedbackEvent({
      context: input.context,
      repository: input.feedbackRepository,
      source: "system",
      resourceType: "call_session",
      resourceId: input.callId,
      outcome:
        input.status === "failed" ? "failed" : input.status === "handoff" ? "handoff" : "resolved",
    });
  }

  return ok(updated);
}
