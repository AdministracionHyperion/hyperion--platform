import type { SanitizedProviderEvent } from "./sanitized-provider-event";
import type { ProviderEventStatus } from "./provider-event-status";

export interface ProviderEventResult {
  readonly eventId: string;
  readonly status: ProviderEventStatus;
  readonly replayDetected: boolean;
  readonly normalizedType?: string;
  readonly processed: boolean;
  readonly safeSummary?: string;
  readonly event?: SanitizedProviderEvent;
  readonly auditRefs: readonly string[];
}
