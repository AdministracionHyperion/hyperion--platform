import type { EvalRepositoryPort } from "../../../../modules/agent-platform/evals/src/eval-repository.port";
import type { EvalScenario } from "../../../../modules/agent-platform/evals/src/eval-scenario";
import type { EvalScenarioId } from "../../../../modules/agent-platform/evals/src/eval-scenario-id";

export class InMemoryEvalRepository implements EvalRepositoryPort {
  private readonly scenarios = new Map<string, EvalScenario>();

  async saveScenario(scenario: EvalScenario): Promise<void> {
    this.scenarios.set(key(scenario.tenantId, scenario.evalScenarioId), scenario);
  }

  async findScenario(
    tenantId: string,
    evalScenarioId: EvalScenarioId,
  ): Promise<EvalScenario | null> {
    return this.scenarios.get(key(tenantId, evalScenarioId)) ?? null;
  }

  async findScenariosByTenant(tenantId: string): Promise<readonly EvalScenario[]> {
    return [...this.scenarios.values()].filter((scenario) => scenario.tenantId === tenantId);
  }
}

function key(tenantId: string, id: string): string {
  return `${tenantId}:${id}`;
}
