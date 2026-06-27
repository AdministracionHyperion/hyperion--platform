import type { EventBusPort } from "./event-bus.port";
import type { EventEnvelope } from "./event-envelope";

export class InMemoryEventBus implements EventBusPort {
  private readonly events: EventEnvelope[] = [];

  async publish<TPayload>(event: EventEnvelope<TPayload>): Promise<void> {
    this.events.push(event as EventEnvelope);
  }

  async publishMany<TPayload>(events: readonly EventEnvelope<TPayload>[]): Promise<void> {
    this.events.push(...(events as readonly EventEnvelope[]));
  }

  getPublishedEvents(): readonly EventEnvelope[] {
    return [...this.events];
  }
}
