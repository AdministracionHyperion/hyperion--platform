import {
  domainError,
  fail,
  ok,
  type DomainError,
  type OperationContext,
  type Result,
} from "../../../../../packages/shared/src/core";
import type { CallId } from "../call-id";
import type { CallSession } from "../call-session";
import type { CallSessionRepositoryPort } from "../call-session-repository.port";
import { canTransitionCallStatus, type CallStatus } from "../call-status";
import type { CallEventRepositoryPort } from "../call-event-repository.port";
import { registerCallEvent } from "./register-call-event";

export interface TransitionCallStatusInput {
  readonly context: OperationContext;
  readonly sessionRepository: CallSessionRepositoryPort;
  readonly eventRepository?: CallEventRepositoryPort;
  readonly callId: CallId;
  readonly nextStatus: CallStatus;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export async function transitionCallStatus(
  input: TransitionCallStatusInput,
): Promise<Result<CallSession, DomainError>> {
  const session = await input.sessionRepository.findById(input.context.tenantId, input.callId);
  if (!session) {
    return fail(domainError("not_found", "call session not found"));
  }

  if (!canTransitionCallStatus(session.status, input.nextStatus)) {
    return fail(
      domainError(
        "invalid_state",
        `invalid call status transition ${session.status} -> ${input.nextStatus}`,
      ),
    );
  }

  const updated: CallSession = {
    ...session,
    status: input.nextStatus,
    startedAt: input.nextStatus === "in_progress" ? input.context.occurredAt : session.startedAt,
    updatedAt: input.context.occurredAt,
  };
  await input.sessionRepository.save(updated);

  if (input.eventRepository) {
    await registerCallEvent({
      context: input.context,
      repository: input.eventRepository,
      callId: input.callId,
      type: "call.status_changed",
      status: input.nextStatus,
      metadata: input.metadata,
    });
  }

  return ok(updated);
}
