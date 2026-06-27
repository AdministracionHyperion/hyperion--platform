import type { DashboardAuditPreview } from "./dashboard-audit-preview";
import type { DashboardCard } from "./dashboard-card";
import type { DashboardEvalSummary } from "./dashboard-eval-summary";
import type { DashboardMetric } from "./dashboard-metric";
import type { DashboardRuntimeSafety } from "./dashboard-runtime-safety";
import type { DashboardStatus } from "./dashboard-status";

export interface DashboardMockCallFlow {
  readonly flowId: string;
  readonly sessionId: string;
  readonly providerCallRef: `mock_call_${string}`;
  readonly status: string;
  readonly safeContactRef: string;
  readonly callPurpose: string;
  readonly disposition: string;
  readonly handoffRecommended: boolean;
  readonly createdAt: string;
  readonly completedAt?: string;
}

export interface DashboardProviderEvent {
  readonly eventId: string;
  readonly providerCallRef: `mock_call_${string}`;
  readonly source: "mock";
  readonly type: `provider.mock.${string}`;
  readonly status: string;
  readonly replayBlocked: boolean;
  readonly processed: boolean;
  readonly occurredAt: string;
}

export interface DashboardPolicyGateSummary {
  readonly deniedTotal: number;
  readonly topDeniedReasons: readonly string[];
  readonly realCallsBlocked: boolean;
  readonly providerEgressBlocked: boolean;
  readonly rawTextBlocked: boolean;
  readonly rawRecordingBlocked: boolean;
  readonly dataExportBlocked: boolean;
}

export interface OperationalDashboardReadModel {
  readonly tenantId: string;
  readonly correlationId: string;
  readonly generatedAt: string;
  readonly overallStatus: DashboardStatus;
  readonly summaryCards: readonly DashboardCard[];
  readonly mockCallFlows: readonly DashboardMockCallFlow[];
  readonly providerEvents: readonly DashboardProviderEvent[];
  readonly evalSummary: DashboardEvalSummary;
  readonly policyGateSummary: DashboardPolicyGateSummary;
  readonly runtimeSafety: DashboardRuntimeSafety;
  readonly auditPreview: readonly DashboardAuditPreview[];
  readonly metricsSnapshot: readonly DashboardMetric[];
}
