export type {
  DashboardAuditPreview,
  DashboardCard,
  DashboardEvalSummary,
  DashboardMetric,
  DashboardMockCallFlow,
  DashboardPolicyGateSummary,
  DashboardProviderEvent,
  DashboardRuntimeSafety,
  OperationalDashboardReadModel,
} from "../../../../modules/core/operations-dashboard/src";

export interface DashboardEnvelope<T> {
  readonly ok: boolean;
  readonly data: T;
  readonly meta: {
    readonly correlationId: string;
    readonly tenantId?: string;
    readonly timestamp: string;
  };
}
