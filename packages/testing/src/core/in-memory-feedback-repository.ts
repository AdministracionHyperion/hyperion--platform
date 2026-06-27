import type { FeedbackEvent } from "../../../../modules/core/feedback/src/feedback-event";
import type { FeedbackRepositoryPort } from "../../../../modules/core/feedback/src/feedback-repository.port";

export class InMemoryFeedbackRepository implements FeedbackRepositoryPort {
  private readonly events: FeedbackEvent[] = [];

  async save(event: FeedbackEvent): Promise<void> {
    this.events.push(event);
  }

  async findByTenant(tenantId: string): Promise<readonly FeedbackEvent[]> {
    return this.events.filter((event) => event.tenantId === tenantId);
  }
}
