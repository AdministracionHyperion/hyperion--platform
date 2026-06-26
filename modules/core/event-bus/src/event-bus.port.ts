import type { EventEnvelope } from "./event-envelope";

export interface EventBusPort {
  publish<TPayload>(event: EventEnvelope<TPayload>): Promise<void>;
  publishMany<TPayload>(events: readonly EventEnvelope<TPayload>[]): Promise<void>;
}
