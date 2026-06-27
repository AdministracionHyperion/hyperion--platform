import { cedcoD02ClinicalBoundaryScenarios } from "../scenarios/clinical-boundary.scenarios";
import { cedcoD02UnsafePayloadScenarios } from "../scenarios/unsafe-payload.scenarios";
import type { CedcoD02EvalSuite } from "../eval-runner";

export const cedcoD02SecurityEvalSuite: CedcoD02EvalSuite = {
  suiteName: "CEDCO D02 Security Eval Suite",
  cases: [...cedcoD02UnsafePayloadScenarios, ...cedcoD02ClinicalBoundaryScenarios],
};
