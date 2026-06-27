import { cedcoD02ComplianceScenarios } from "../scenarios/compliance.scenarios";
import { cedcoD02EligibilityScenarios } from "../scenarios/eligibility.scenarios";
import { cedcoD02HandoffScenarios } from "../scenarios/handoff.scenarios";
import { cedcoD02OrientationScenarios } from "../scenarios/orientation.scenarios";
import { cedcoD02ReadinessScenarios } from "../scenarios/readiness.scenarios";
import { cedcoD02SchedulingScenarios } from "../scenarios/scheduling.scenarios";
import type { CedcoD02EvalSuite } from "../eval-runner";

export const cedcoD02CoreEvalSuite: CedcoD02EvalSuite = {
  suiteName: "CEDCO D02 Core Eval Suite",
  cases: [
    ...cedcoD02ReadinessScenarios,
    ...cedcoD02ComplianceScenarios,
    ...cedcoD02SchedulingScenarios,
    ...cedcoD02EligibilityScenarios,
    ...cedcoD02OrientationScenarios,
    ...cedcoD02HandoffScenarios,
  ],
};
