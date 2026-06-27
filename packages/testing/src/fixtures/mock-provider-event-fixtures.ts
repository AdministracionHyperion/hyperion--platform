export const mockProviderEventHeaders = {
  "x-actor-id": "actor-test",
  "x-actor-roles": "voice-operator",
  "x-correlation-id": "corr-provider-event-001",
  "x-hyperion-mock-signature": "mock_valid_signature",
};

export const mockProviderEventFixture = {
  eventId: "provider-event-001",
  source: "mock",
  type: "provider.mock.post_call.available",
  providerCallRef: "mock_call_cedco_001",
  occurredAt: "2026-06-27T04:00:00.000Z",
  safeSummary: "Synthetic mock post-call summary for CEDCO D02.",
  safeIntent: "orientacion_general",
  disposition: "mock_completed",
  handoffRecommended: false,
  metadata: {
    safeCallSessionRef: "mock-session-provider-event-001",
    channel: "mock-provider-event-test",
  },
} as const;
