import {
  buildOperationalDashboard,
  type DashboardAuditPreview,
  type DashboardMetric,
  type OperationalDashboardReadModel,
} from "../../../../../../core/operations-dashboard/src";
import { buildCedcoD02EvalDashboardSummary } from "./build-cedco-d02-eval-dashboard-summary";
import {
  buildCedcoD02MockFlowSummary,
  buildCedcoD02ProviderEventSummary,
} from "./build-cedco-d02-mock-flow-summary";

export function buildCedcoD02DashboardSummary(input: {
  readonly tenantId: string;
  readonly correlationId: string;
  readonly generatedAt?: Date;
  readonly auditPreview?: readonly DashboardAuditPreview[];
  readonly metricsSnapshot?: readonly DashboardMetric[];
}): OperationalDashboardReadModel {
  const generatedAt = input.generatedAt ?? new Date("2026-06-27T00:00:00.000Z");
  return buildOperationalDashboard({
    tenantId: input.tenantId,
    correlationId: input.correlationId,
    generatedAt,
    mockCallFlows: buildCedcoD02MockFlowSummary({
      correlationId: input.correlationId,
      generatedAt,
    }),
    providerEvents: buildCedcoD02ProviderEventSummary({
      correlationId: input.correlationId,
      generatedAt,
    }),
    evalSummary: buildCedcoD02EvalDashboardSummary(),
    policyGateSummary: {
      deniedTotal: 0,
      topDeniedReasons: [],
      realCallsBlocked: true,
      providerEgressBlocked: true,
      rawTextBlocked: true,
      rawRecordingBlocked: true,
      dataExportBlocked: true,
    },
    auditPreview: input.auditPreview ?? [
      {
        auditId: `audit-${input.correlationId}-dashboard-read`,
        action: "operations.dashboard.read",
        severity: "info",
        occurredAt: generatedAt.toISOString(),
        correlationId: input.correlationId,
        metadata: { source: "cedco-d02-dashboard-summary" },
      },
    ],
    metricsSnapshot: input.metricsSnapshot ?? [
      {
        metricName: "mock_call_flows_completed_total",
        value: 1,
        labels: { tenantId: input.tenantId },
      },
    ],
  });
}
