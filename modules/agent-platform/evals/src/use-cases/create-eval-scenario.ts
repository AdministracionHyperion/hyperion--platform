import {
  domainError,
  fail,
  ok,
  type DomainError,
  type OperationContext,
  type Result,
} from "../../../../../packages/shared/src/core";
import type { EvalCriterion } from "../eval-criterion";
import type { EvalRepositoryPort } from "../eval-repository.port";
import type { EvalScenario } from "../eval-scenario";
import { createEvalScenarioId } from "../eval-scenario-id";

export interface CreateEvalScenarioInput {
  readonly context: OperationContext;
  readonly repository: EvalRepositoryPort;
  readonly evalScenarioId: string;
  readonly name: string;
  readonly description: string;
  readonly category: string;
  readonly input: string;
  readonly expectedBehavior: string;
  readonly forbiddenBehavior: string;
  readonly criteria: readonly EvalCriterion[];
}

export async function createEvalScenario(
  input: CreateEvalScenarioInput,
): Promise<Result<EvalScenario, DomainError>> {
  const evalScenarioId = createEvalScenarioId(input.evalScenarioId);
  if (!evalScenarioId.ok) {
    return fail(evalScenarioId.error);
  }

  if (input.criteria.length === 0) {
    return fail(domainError("invalid_state", "eval scenario requires at least one criterion"));
  }

  const scenario: EvalScenario = {
    evalScenarioId: evalScenarioId.value,
    tenantId: input.context.tenantId,
    name: input.name,
    description: input.description,
    category: input.category,
    input: input.input,
    expectedBehavior: input.expectedBehavior,
    forbiddenBehavior: input.forbiddenBehavior,
    criteria: input.criteria,
    createdBy: input.context.actorId,
    createdAt: input.context.occurredAt,
  };

  await input.repository.saveScenario(scenario);
  return ok(scenario);
}
