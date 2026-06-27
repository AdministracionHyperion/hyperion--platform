import { cedcoD02MockRuntimeRegressionScenarios } from "../scenarios/mock-runtime-regression.scenarios";
import { cedcoD02ProviderEventRegressionScenarios } from "../scenarios/provider-event-regression.scenarios";
import type { CedcoD02EvalSuite } from "../eval-runner";

export const cedcoD02RuntimeRegressionSuite: CedcoD02EvalSuite = {
  suiteName: "CEDCO D02 Runtime Regression Suite",
  cases: [...cedcoD02MockRuntimeRegressionScenarios, ...cedcoD02ProviderEventRegressionScenarios],
};
