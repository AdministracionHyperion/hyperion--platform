import { cedcoD02CoreEvalSuite } from "./cedco-d02-core-eval-suite";
import { cedcoD02RuntimeRegressionSuite } from "./cedco-d02-runtime-regression-suite";
import { cedcoD02SecurityEvalSuite } from "./cedco-d02-security-eval-suite";
import type { CedcoD02EvalSuite } from "../eval-runner";

export const cedcoD02FullEvalSuite: CedcoD02EvalSuite = {
  suiteName: "CEDCO D02 Full Deterministic Eval Suite",
  cases: [
    ...cedcoD02CoreEvalSuite.cases,
    ...cedcoD02SecurityEvalSuite.cases,
    ...cedcoD02RuntimeRegressionSuite.cases,
  ],
};
