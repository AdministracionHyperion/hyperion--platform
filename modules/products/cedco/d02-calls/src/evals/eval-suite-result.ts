import type { CedcoD02EvalScore } from "./eval-score";
import type { CedcoD02EvalResult } from "./eval-result";

export interface CedcoD02EvalSuiteResult {
  readonly suiteName: string;
  readonly startedAt: Date;
  readonly completedAt: Date;
  readonly durationMs: number;
  readonly totals: CedcoD02EvalScore;
  readonly results: readonly CedcoD02EvalResult[];
  readonly criticalFailures: readonly CedcoD02EvalResult[];
  readonly markdownReport: string;
  readonly jsonReport: string;
}
