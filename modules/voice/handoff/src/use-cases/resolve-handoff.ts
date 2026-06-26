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
import type { ActorContext } from "../../../../core/identity-access/src/actor-context";
import { rolesAllow } from "../../../../core/identity-access/src/rbac-policy";
import type { HandoffId } from "../handoff-id";
import type { HandoffRepositoryPort } from "../handoff-repository.port";
import type { HandoffRequest } from "../handoff-request";

export interface ResolveHandoffInput {
  readonly context: OperationContext;
  readonly actor: ActorContext;
  readonly repository: HandoffRepositoryPort;
  readonly handoffId: HandoffId;
  readonly feedbackRepository?: FeedbackRepositoryPort;
}

export async function resolveHandoff(
  input: ResolveHandoffInput,
): Promise<Result<HandoffRequest, DomainError>> {
  if (!rolesAllow(input.actor.roles, "voice:handoff:manage")) {
    return fail(domainError("forbidden", "actor cannot resolve handoff"));
  }

  const request = await input.repository.findById(input.context.tenantId, input.handoffId);
  if (!request) {
    return fail(domainError("not_found", "handoff request not found"));
  }

  const resolved: HandoffRequest = {
    ...request,
    status: "resolved",
    resolvedAt: input.context.occurredAt,
  };
  await input.repository.save(resolved);

  if (input.feedbackRepository) {
    await recordFeedbackEvent({
      context: input.context,
      repository: input.feedbackRepository,
      source: "human",
      resourceType: "handoff_request",
      resourceId: resolved.handoffId,
      outcome: "resolved",
      metadata: { callId: resolved.callId },
    });
  }

  return ok(resolved);
}
