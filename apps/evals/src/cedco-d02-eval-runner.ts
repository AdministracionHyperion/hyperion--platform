import {
  cedcoD02FullEvalSuite,
  runCedcoD02EvalSuite,
  type CedcoD02EvalSuite,
  type CedcoD02EvalSuiteResult,
} from "../../../modules/products/cedco/d02-calls/src/evals";

export interface CedcoD02EvalCliResult {
  readonly exitCode: 0 | 1;
  readonly summary: string;
  readonly result: CedcoD02EvalSuiteResult;
  readonly jsonReport: string;
  readonly markdownReport: string;
}

export function runCedcoD02EvalCli(
  input: {
    readonly suite?: CedcoD02EvalSuite;
  } = {},
): CedcoD02EvalCliResult {
  const result = runCedcoD02EvalSuite(input.suite ?? cedcoD02FullEvalSuite);
  const summary = [
    `${result.suiteName}`,
    `grade=${result.totals.grade}`,
    `score=${result.totals.percentage}`,
    `weighted=${result.totals.weightedPercentage}`,
    `criticalFailures=${result.totals.criticalFailed}`,
    `total=${result.totals.total}`,
  ].join(" ");

  return {
    exitCode: result.totals.criticalFailed > 0 || result.totals.grade === "fail" ? 1 : 0,
    summary,
    result,
    jsonReport: result.jsonReport,
    markdownReport: result.markdownReport,
  };
}
