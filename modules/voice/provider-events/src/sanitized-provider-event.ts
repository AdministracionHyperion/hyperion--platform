import type { SafeMetadata } from "../../../../packages/shared/src/core";
import type { ProviderEventId } from "./provider-event-id";
import type { ProviderEventSource } from "./provider-event-source";
import type { ProviderEventType } from "./provider-event-type";

export interface SanitizedProviderEvent {
  readonly eventId: ProviderEventId;
  readonly source: Extract<ProviderEventSource, "mock">;
  readonly type: ProviderEventType;
  readonly tenantId: string;
  readonly correlationId: string;
  readonly providerCallRef: string;
  readonly safeCallSessionRef: string;
  readonly normalizedStatus:
    | "started"
    | "ringing"
    | "answered"
    | "intent_detected"
    | "completed"
    | "failed"
    | "post_call_available";
  readonly safeOutcome?: string;
  readonly safeSummary?: string;
  readonly safeIntent?: string;
  readonly handoffRecommended: boolean;
  readonly postCallAvailable: boolean;
  readonly metadata: SafeMetadata;
}
