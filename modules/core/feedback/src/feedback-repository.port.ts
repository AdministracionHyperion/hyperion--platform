import type { FeedbackEvent } from "./feedback-event";

export interface FeedbackRepositoryPort {
  save(event: FeedbackEvent): Promise<void>;
  findByTenant(tenantId: string): Promise<readonly FeedbackEvent[]>;
}
