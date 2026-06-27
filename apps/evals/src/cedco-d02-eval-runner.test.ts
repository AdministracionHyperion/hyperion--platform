import { describe, expect, it } from "vitest";
import {
  defineCedcoD02EvalCase,
  actualControlledFailure,
  expectedPass,
} from "../../../modules/products/cedco/d02-calls/src/evals";
import { runCedcoD02EvalCli } from "./cedco-d02-eval-runner";

describe("CEDCO D02 eval CLI runner", () => {
  it("returns success with the full clean suite", () => {
    const result = runCedcoD02EvalCli();
    expect(result.exitCode).toBe(0);
    expect(result.summary).toContain("grade=pass");
  });

  it("returns failure with a simulated critical failure", () => {
    const result = runCedcoD02EvalCli({
      suite: {
        suiteName: "Simulated Failure Suite",
        cases: [
          defineCedcoD02EvalCase({
            caseId: "cedco-d02.readiness.999",
            type: "readiness",
            severity: "critical",
            name: "simulated failure",
            expected: expectedPass(),
            actual: actualControlledFailure(["simulated_failure"]),
          }),
        ],
      },
    });
    expect(result.exitCode).toBe(1);
    expect(result.result.totals.grade).toBe("blocked");
  });

  it("JSON report does not contain PII", () => {
    const result = runCedcoD02EvalCli();
    expect(result.jsonReport).not.toMatch(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/iu);
  });

  it("markdown report is stable enough for sample docs", () => {
    const result = runCedcoD02EvalCli();
    expect(result.markdownReport).toContain("| Case | Type | Severity | Result | Failures |");
  });
});
