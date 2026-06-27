import type {
  DashboardMockCallFlow,
  DashboardPolicyGateSummary,
  DashboardProviderEvent,
  OperationalDashboardReadModel,
} from "./dashboard-read-model";
import type { DashboardAuditPreview } from "./dashboard-audit-preview";
import type { DashboardEvalSummary } from "./dashboard-eval-summary";
import type { DashboardMetric } from "./dashboard-metric";
import { defaultDashboardRuntimeSafety } from "./dashboard-runtime-safety";
import { resolveDashboardStatus } from "./dashboard-status";
import { sanitizeDashboardData } from "./sanitize-dashboard-data";

export interface BuildOperationalDashboardInput {
  readonly tenantId: string;
  readonly correlationId: string;
  readonly generatedAt?: Date;
  readonly mockCallFlows?: readonly DashboardMockCallFlow[];
  readonly providerEvents?: readonly DashboardProviderEvent[];
  readonly evalSummary: DashboardEvalSummary;
  readonly policyGateSummary?: Partial<DashboardPolicyGateSummary>;
  readonly auditPreview?: readonly DashboardAuditPreview[];
  readonly metricsSnapshot?: readonly DashboardMetric[];
}

export function buildOperationalDashboard(
  input: BuildOperationalDashboardInput,
): OperationalDashboardReadModel {
  const policyGateSummary: DashboardPolicyGateSummary = {
    deniedTotal: input.policyGateSummary?.deniedTotal ?? 0,
    topDeniedReasons: input.policyGateSummary?.topDeniedReasons ?? [],
    realCallsBlocked: input.policyGateSummary?.realCallsBlocked ?? true,
    providerEgressBlocked: input.policyGateSummary?.providerEgressBlocked ?? true,
    rawTextBlocked: input.policyGateSummary?.rawTextBlocked ?? true,
    rawRecordingBlocked: input.policyGateSummary?.rawRecordingBlocked ?? true,
    dataExportBlocked: input.policyGateSummary?.dataExportBlocked ?? true,
  };
  const mockCallFlows = input.mockCallFlows ?? [];
  const providerEvents = input.providerEvents ?? [];
  const auditPreview = input.auditPreview ?? [];
  const metricsSnapshot = input.metricsSnapshot ?? [];
  const overallStatus = resolveDashboardStatus({
    criticalEvalFailures: input.evalSummary.criticalFailed,
    policyGateDenials: policyGateSummary.deniedTotal,
    mockCallFlowsTotal: mockCallFlows.length,
  });

  return sanitizeDashboardData({
    tenantId: input.tenantId,
    correlationId: input.correlationId,
    generatedAt: (input.generatedAt ?? new Date()).toISOString(),
    overallStatus,
    summaryCards: [
      card("mockCallFlowsTotal", "Mock call flows", mockCallFlows.length, overallStatus),
      card(
        "mockCallFlowsCompleted",
        "Mock completed",
        mockCallFlows.filter((flow) => flow.status === "completed").length,
        "healthy",
      ),
      card(
        "mockProviderEventsProcessed",
        "Provider events",
        providerEvents.filter((event) => event.processed).length,
        "healthy",
      ),
      card("policyGateDenials", "Policy denials", policyGateSummary.deniedTotal, "degraded"),
      card(
        "rateLimitDenials",
        "Rate limit denials",
        countMetric(metricsSnapshot, "rate_limit_denied_total"),
        "degraded",
      ),
      card("evalScore", "Eval score", `${input.evalSummary.weightedPercentage}%`, overallStatus),
      card(
        "criticalEvalFailures",
        "Critical eval failures",
        input.evalSummary.criticalFailed,
        overallStatus,
      ),
      card("auditEvents", "Audit events", auditPreview.length, "healthy"),
    ],
    mockCallFlows,
    providerEvents,
    evalSummary: input.evalSummary,
    policyGateSummary,
    runtimeSafety: defaultDashboardRuntimeSafety(),
    auditPreview,
    metricsSnapshot,
  });
}

function card(
  key: string,
  label: string,
  value: string | number,
  status: "healthy" | "degraded" | "blocked" | "unknown",
) {
  return {
    key,
    label,
    value,
    status,
    helperText: "Read-only operational metric",
  };
}

function countMetric(metrics: readonly DashboardMetric[], name: string): number {
  return metrics
    .filter((metric) => metric.metricName === name)
    .reduce((sum, metric) => sum + metric.value, 0);
}
