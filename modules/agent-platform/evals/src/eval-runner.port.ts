import type { EvalResult } from "./eval-result";
import type { EvalRun } from "./eval-run";
import type { EvalScenario } from "./eval-scenario";

export interface EvalRunnerPort {
  runScenario(run: EvalRun, scenario: EvalScenario): Promise<EvalResult>;
}
