export const dashboardStatuses = ["healthy", "degraded", "blocked", "unknown"] as const;

export type DashboardStatus = (typeof dashboardStatuses)[number];

export function resolveDashboardStatus(input: {
  readonly criticalEvalFailures: number;
  readonly policyGateDenials: number;
  readonly mockCallFlowsTotal: number;
}): DashboardStatus {
  if (input.criticalEvalFailures > 0) return "blocked";
  if (input.policyGateDenials > 0) return "degraded";
  if (input.mockCallFlowsTotal >= 0) return "healthy";
  return "unknown";
}
