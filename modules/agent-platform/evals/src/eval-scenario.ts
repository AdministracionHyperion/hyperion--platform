import type { EvalCriterion } from "./eval-criterion";
import type { EvalScenarioId } from "./eval-scenario-id";

export interface EvalScenario {
  readonly evalScenarioId: EvalScenarioId;
  readonly tenantId: string;
  readonly name: string;
  readonly description: string;
  readonly category: string;
  readonly input: string;
  readonly expectedBehavior: string;
  readonly forbiddenBehavior: string;
  readonly criteria: readonly EvalCriterion[];
  readonly createdBy: string;
  readonly createdAt: Date;
}
