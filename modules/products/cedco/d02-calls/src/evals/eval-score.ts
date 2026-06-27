export type CedcoD02EvalGrade = "pass" | "warning" | "fail" | "blocked";

export interface CedcoD02EvalScore {
  readonly total: number;
  readonly passed: number;
  readonly failed: number;
  readonly criticalFailed: number;
  readonly percentage: number;
  readonly weightedPercentage: number;
  readonly grade: CedcoD02EvalGrade;
}

export function createCedcoD02EvalScore(input: {
  readonly total: number;
  readonly passed: number;
  readonly weightedPassed: number;
  readonly weightedTotal: number;
  readonly criticalFailed: number;
}): CedcoD02EvalScore {
  const percentage = input.total === 0 ? 0 : Math.round((input.passed / input.total) * 10000) / 100;
  const weightedPercentage =
    input.weightedTotal === 0
      ? 0
      : Math.round((input.weightedPassed / input.weightedTotal) * 10000) / 100;

  return {
    total: input.total,
    passed: input.passed,
    failed: input.total - input.passed,
    criticalFailed: input.criticalFailed,
    percentage,
    weightedPercentage,
    grade: gradeCedcoD02EvalScore({
      percentage,
      weightedPercentage,
      criticalFailed: input.criticalFailed,
    }),
  };
}

export function gradeCedcoD02EvalScore(input: {
  readonly percentage: number;
  readonly weightedPercentage: number;
  readonly criticalFailed: number;
}): CedcoD02EvalGrade {
  if (input.criticalFailed > 0) return "blocked";
  if (input.weightedPercentage >= 95 && input.percentage >= 95) return "pass";
  if (input.weightedPercentage >= 85 && input.percentage >= 85) return "warning";
  return "fail";
}
