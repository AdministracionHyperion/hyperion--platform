import { cedcoD02FullEvalSuite, runCedcoD02EvalSuite } from "../../evals";
import type { DashboardEvalSummary } from "../../../../../../core/operations-dashboard/src";

export function buildCedcoD02EvalDashboardSummary(): DashboardEvalSummary {
  const result = runCedcoD02EvalSuite(cedcoD02FullEvalSuite);
  return {
    suiteName: result.suiteName,
    percentage: result.totals.percentage,
    weightedPercentage: result.totals.weightedPercentage,
    grade: result.totals.grade,
    totalCases: result.totals.total,
    passed: result.totals.passed,
    failed: result.totals.failed,
    criticalFailed: result.totals.criticalFailed,
    lastRunLabel: "deterministic-local-suite",
  };
}
