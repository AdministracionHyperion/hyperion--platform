import type { SanitizedProviderEvent } from "../../../../../../voice/provider-events/src";

export interface CedcoD02ProviderEventOutcome {
  readonly tenantId: string;
  readonly correlationId: string;
  readonly eventId: string;
  readonly providerCallRef: string;
  readonly outcome: string;
  readonly disposition: string;
  readonly safeSummary: string;
  readonly handoffRecommended: boolean;
  readonly complianceNote: string;
}

export function mapProviderEventToCedcoD02Outcome(
  event: SanitizedProviderEvent,
): CedcoD02ProviderEventOutcome {
  const safeSummary =
    event.safeSummary ?? `CEDCO D02 processed sanitized ${event.normalizedStatus} provider event.`;
  return {
    tenantId: event.tenantId,
    correlationId: event.correlationId,
    eventId: event.eventId,
    providerCallRef: event.providerCallRef,
    outcome: event.safeOutcome ?? event.normalizedStatus,
    disposition: event.safeOutcome ?? "mock_provider_event_processed",
    safeSummary,
    handoffRecommended: event.handoffRecommended,
    complianceNote:
      "Operational post-call note only. No diagnosis, clinical triage, or patient record content.",
  };
}
