import type { CedcoD02EvalSuiteResult } from "./eval-suite-result";

export function buildCedcoD02EvalMarkdownReport(
  result: Omit<CedcoD02EvalSuiteResult, "markdownReport" | "jsonReport">,
): string {
  const lines = [
    `# ${result.suiteName}`,
    "",
    `Generated at: ${result.completedAt.toISOString()}`,
    `Duration: ${result.durationMs} ms`,
    `Grade: ${result.totals.grade}`,
    `Score: ${result.totals.percentage}%`,
    `Weighted score: ${result.totals.weightedPercentage}%`,
    `Critical failures: ${result.totals.criticalFailed}`,
    "",
    "| Case | Type | Severity | Result | Failures |",
    "| --- | --- | --- | --- | --- |",
    ...result.results.map(
      (item) =>
        `| ${item.caseId} | ${item.type} | ${item.severity} | ${
          item.passed ? "pass" : "fail"
        } | ${item.failures.join("; ") || "-"} |`,
    ),
    "",
    "## Recommendations",
    result.criticalFailures.length > 0
      ? "- Block progression until all critical failures are resolved."
      : "- Keep evals in CI before enabling real integrations.",
    "- Keep CEDCO D02 in mock-only mode until provider approvals, runbooks and smoke gates exist.",
  ];

  return lines.join("\n");
}

export function buildCedcoD02EvalJsonReport(
  result: Omit<CedcoD02EvalSuiteResult, "markdownReport" | "jsonReport">,
): string {
  return JSON.stringify(
    {
      suiteName: result.suiteName,
      generatedAt: result.completedAt.toISOString(),
      totals: result.totals,
      criticalFailures: result.criticalFailures.map((item) => item.caseId),
      results: result.results.map((item) => ({
        caseId: item.caseId,
        type: item.type,
        severity: item.severity,
        passed: item.passed,
        failures: item.failures,
      })),
    },
    null,
    2,
  );
}
