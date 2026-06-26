import {
  createCorrelationId,
  sanitizeMetadata,
  type OperationContext,
} from "../../../../../packages/shared/src/core";
import { createEventEnvelope } from "../../../../core/event-bus/src/event-envelope";
import type { EventBusPort } from "../../../../core/event-bus/src/event-bus.port";
import type { CallEvent, CallEventId } from "../call-event";
import type { CallEventRepositoryPort } from "../call-event-repository.port";
import type { CallEventType } from "../call-event-type";
import type { CallId } from "../call-id";
import type { CallStatus } from "../call-status";

export interface RegisterCallEventInput {
  readonly context: OperationContext;
  readonly repository: CallEventRepositoryPort;
  readonly callId: CallId;
  readonly type: CallEventType;
  readonly status?: CallStatus;
  readonly metadata?: Readonly<Record<string, unknown>>;
  readonly eventBus?: EventBusPort;
}

export async function registerCallEvent(input: RegisterCallEventInput): Promise<CallEvent> {
  const event: CallEvent = {
    callEventId: createCallEventId(),
    callId: input.callId,
    tenantId: input.context.tenantId,
    actorId: input.context.actorId,
    correlationId: input.context.correlationId,
    type: input.type,
    status: input.status,
    metadata: sanitizeMetadata(input.metadata),
    occurredAt: input.context.occurredAt,
  };

  await input.repository.append(event);

  if (input.eventBus) {
    await input.eventBus.publish(
      createEventEnvelope(input.context, {
        type: event.type,
        payload: { callId: event.callId, status: event.status },
        occurredAt: event.occurredAt,
      }),
    );
  }

  return event;
}

export function createCallEventId(): CallEventId {
  const correlationId = createCorrelationId();
  return (
    correlationId.ok ? `call-event-${correlationId.value}` : `call-event-${Date.now()}`
  ) as CallEventId;
}
