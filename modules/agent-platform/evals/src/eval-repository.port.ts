import type { EvalScenario } from "./eval-scenario";
import type { EvalScenarioId } from "./eval-scenario-id";

export interface EvalRepositoryPort {
  saveScenario(scenario: EvalScenario): Promise<void>;
  findScenario(tenantId: string, evalScenarioId: EvalScenarioId): Promise<EvalScenario | null>;
  findScenariosByTenant(tenantId: string): Promise<readonly EvalScenario[]>;
}
