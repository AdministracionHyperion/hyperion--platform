import type {
  DashboardMockCallFlow,
  DashboardProviderEvent,
} from "../../../../../../core/operations-dashboard/src";

export function buildCedcoD02MockFlowSummary(input: {
  readonly correlationId: string;
  readonly generatedAt?: Date;
}): readonly DashboardMockCallFlow[] {
  const occurredAt = (input.generatedAt ?? new Date("2026-06-27T00:00:00.000Z")).toISOString();
  return [
    {
      flowId: `mock-flow-${input.correlationId}`,
      sessionId: `mock-session-${input.correlationId}`,
      providerCallRef: `mock_call_${input.correlationId}`,
      status: "completed",
      safeContactRef: "safe-contact-ref-001",
      callPurpose: "orientation",
      disposition: "resolved_mock",
      handoffRecommended: false,
      createdAt: occurredAt,
      completedAt: occurredAt,
    },
  ];
}

export function buildCedcoD02ProviderEventSummary(input: {
  readonly correlationId: string;
  readonly generatedAt?: Date;
}): readonly DashboardProviderEvent[] {
  const occurredAt = (input.generatedAt ?? new Date("2026-06-27T00:00:00.000Z")).toISOString();
  return [
    {
      eventId: `provider-event-${input.correlationId}`,
      providerCallRef: `mock_call_${input.correlationId}`,
      source: "mock",
      type: "provider.mock.post_call.available",
      status: "processed",
      replayBlocked: false,
      processed: true,
      occurredAt,
    },
  ];
}
