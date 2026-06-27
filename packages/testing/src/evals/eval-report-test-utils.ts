import type { CedcoD02EvalSuiteResult } from "../../../../modules/products/cedco/d02-calls/src/evals";

export function normalizeCedcoD02EvalReportForSnapshot(report: string): string {
  return report.replace(/Generated at: .+/u, "Generated at: <normalized>");
}

export function expectCedcoD02EvalSuitePasses(result: CedcoD02EvalSuiteResult): void {
  if (result.totals.grade !== "pass" || result.totals.criticalFailed > 0) {
    throw new Error(`Expected CEDCO D02 eval suite to pass, got ${result.totals.grade}`);
  }
}
