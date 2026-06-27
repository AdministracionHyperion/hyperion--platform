import {
  actualPass,
  cedcoD02FullEvalSuite,
  defineCedcoD02EvalCase,
  expectedPass,
  runCedcoD02EvalSuite,
  type CedcoD02EvalCase,
} from "../../../../modules/products/cedco/d02-calls/src/evals";

export function createPassingCedcoD02EvalCase(
  caseId = "cedco-d02.readiness.1000",
): CedcoD02EvalCase {
  return defineCedcoD02EvalCase({
    caseId,
    type: "readiness",
    severity: "info",
    name: "testing utility passing eval",
    expected: expectedPass(),
    actual: actualPass(),
  });
}

export function runFullCedcoD02EvalSuiteForTests() {
  return runCedcoD02EvalSuite(cedcoD02FullEvalSuite);
}
