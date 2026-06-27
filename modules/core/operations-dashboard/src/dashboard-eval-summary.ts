export interface DashboardEvalSummary {
  readonly suiteName: string;
  readonly percentage: number;
  readonly weightedPercentage: number;
  readonly grade: "pass" | "warning" | "fail" | "blocked";
  readonly totalCases: number;
  readonly passed: number;
  readonly failed: number;
  readonly criticalFailed: number;
  readonly lastRunLabel: string;
}
