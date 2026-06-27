import {
  domainError,
  fail,
  ok,
  sanitizeMetadata,
  type DomainError,
  type OperationContext,
  type Result,
} from "../../../../../packages/shared/src/core";
import type { AuditLogPort } from "../../../../core/audit/src/audit-log.port";
import { recordAuditEvent } from "../../../../core/audit/src/use-cases/record-audit-event";
import { createEventEnvelope } from "../../../../core/event-bus/src/event-envelope";
import type { EventBusPort } from "../../../../core/event-bus/src/event-bus.port";
import type { CallDirection } from "../call-direction";
import { createCallId } from "../call-id";
import type { CallParticipant } from "../call-participant";
import type { CallSession } from "../call-session";
import type { CallSessionRepositoryPort } from "../call-session-repository.port";
import type { CallStatus } from "../call-status";

export interface CreateCallSessionInput {
  readonly context: OperationContext;
  readonly repository: CallSessionRepositoryPort;
  readonly callId: string;
  readonly direction: CallDirection;
  readonly participants: readonly CallParticipant[];
  readonly initialStatus?: "draft" | "scheduled";
  readonly agentRuntimeRef?: string;
  readonly knowledgeRuntimeRef?: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
  readonly auditLog?: AuditLogPort;
  readonly eventBus?: EventBusPort;
}

export async function createCallSession(
  input: CreateCallSessionInput,
): Promise<Result<CallSession, DomainError>> {
  const callId = createCallId(input.callId);
  if (!callId.ok) {
    return fail(callId.error);
  }

  if (input.participants.length === 0) {
    return fail(domainError("invalid_state", "call session requires participants"));
  }

  const status: CallStatus = input.initialStatus ?? "draft";
  const session: CallSession = {
    callId: callId.value,
    tenantId: input.context.tenantId,
    direction: input.direction,
    status,
    participants: input.participants,
    agentRuntimeRef: input.agentRuntimeRef,
    knowledgeRuntimeRef: input.knowledgeRuntimeRef,
    createdAt: input.context.occurredAt,
    updatedAt: input.context.occurredAt,
    correlationId: input.context.correlationId,
    metadata: sanitizeMetadata(input.metadata),
    turns: [],
  };

  await input.repository.save(session);

  if (input.auditLog) {
    await recordAuditEvent(input.auditLog, {
      context: input.context,
      action: "voice.call.created",
      resourceType: "call_session",
      resourceId: session.callId,
      result: "success",
      metadata: { callId: session.callId, direction: session.direction },
    });
  }

  if (input.eventBus) {
    await input.eventBus.publish(
      createEventEnvelope(input.context, {
        type: "voice.call.created",
        payload: sanitizeMetadata({ callId: session.callId, direction: session.direction }),
        occurredAt: input.context.occurredAt,
      }),
    );
  }

  return ok(session);
}
