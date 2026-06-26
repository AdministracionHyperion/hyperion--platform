import type { SafeMetadata } from "../../../../packages/shared/src/core";
import type { FeedbackOutcome } from "./feedback-outcome";
import type { FeedbackSource } from "./feedback-source";

export interface FeedbackEvent {
  readonly feedbackEventId: string;
  readonly tenantId: string;
  readonly actorId?: string;
  readonly correlationId: string;
  readonly source: FeedbackSource;
  readonly resourceType: string;
  readonly resourceId: string;
  readonly outcome: FeedbackOutcome;
  readonly score?: number;
  readonly metadata: SafeMetadata;
  readonly occurredAt: Date;
}
