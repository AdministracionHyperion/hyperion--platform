import {
  createCorrelationId,
  sanitizeMetadata,
  type OperationContext,
} from "../../../../../packages/shared/src/core";
import { createEventEnvelope } from "../../../event-bus/src/event-envelope";
import type { EventBusPort } from "../../../event-bus/src/event-bus.port";
import type { FeedbackEvent } from "../feedback-event";
import type { FeedbackOutcome } from "../feedback-outcome";
import type { FeedbackRepositoryPort } from "../feedback-repository.port";
import type { FeedbackSource } from "../feedback-source";

export interface RecordFeedbackEventInput {
  readonly context: OperationContext;
  readonly repository: FeedbackRepositoryPort;
  readonly source: FeedbackSource;
  readonly resourceType: string;
  readonly resourceId: string;
  readonly outcome: FeedbackOutcome;
  readonly score?: number;
  readonly actorId?: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
  readonly eventBus?: EventBusPort;
}

export async function recordFeedbackEvent(input: RecordFeedbackEventInput): Promise<FeedbackEvent> {
  const event: FeedbackEvent = {
    feedbackEventId: createFeedbackEventId(),
    tenantId: input.context.tenantId,
    actorId: input.actorId ?? input.context.actorId,
    correlationId: input.context.correlationId,
    source: input.source,
    resourceType: input.resourceType,
    resourceId: input.resourceId,
    outcome: input.outcome,
    score: input.score,
    metadata: sanitizeMetadata(input.metadata),
    occurredAt: input.context.occurredAt,
  };

  await input.repository.save(event);

  if (input.eventBus) {
    await input.eventBus.publish(
      createEventEnvelope(input.context, {
        type: "core.feedback.recorded",
        payload: {
          feedbackEventId: event.feedbackEventId,
          resourceType: event.resourceType,
          resourceId: event.resourceId,
          outcome: event.outcome,
        },
        occurredAt: event.occurredAt,
      }),
    );
  }

  return event;
}

function createFeedbackEventId(): string {
  const correlationId = createCorrelationId();
  return correlationId.ok ? `feedback-${correlationId.value}` : `feedback-${Date.now()}`;
}
