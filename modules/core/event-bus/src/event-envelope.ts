import { createCorrelationId } from "../../../../packages/shared/src/core";
import type { OperationContext } from "../../../../packages/shared/src/core";
import type { DomainEvent } from "./domain-event";

export interface EventEnvelope<TPayload = unknown> {
  readonly eventId: string;
  readonly tenantId: string;
  readonly actorId: string;
  readonly correlationId: string;
  readonly type: string;
  readonly payload: TPayload;
  readonly occurredAt: Date;
}

export function createEventEnvelope<TPayload>(
  context: OperationContext,
  event: DomainEvent<TPayload>,
  eventId = createEventId(),
): EventEnvelope<TPayload> {
  return {
    eventId,
    tenantId: context.tenantId,
    actorId: context.actorId,
    correlationId: context.correlationId,
    type: event.type,
    payload: event.payload,
    occurredAt: event.occurredAt,
  };
}

function createEventId(): string {
  const correlationId = createCorrelationId();
  return correlationId.ok ? `event-${correlationId.value}` : `event-${Date.now()}`;
}
