import {
  domainError,
  fail,
  ok,
  sanitizeMetadata,
  validateSafeIdentifier,
  type DomainError,
  type OperationContext,
  type Result,
} from "../../../../../../packages/shared/src/core";
import type { CedcoCallIntent } from "../cedco-call-intent";
import type { CedcoCallObjective } from "../cedco-call-objective";
import type { CedcoD02EvalScenario, CedcoD02EvalSeverity } from "../cedco-d02-eval-scenario";

export interface CreateCedcoD02EvalScenarioInput {
  readonly context: OperationContext;
  readonly evalScenarioId: string;
  readonly intent: CedcoCallIntent;
  readonly objective: CedcoCallObjective;
  readonly input: string;
  readonly expectedBehavior: string;
  readonly forbiddenBehavior: string;
  readonly severity: CedcoD02EvalSeverity;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export function createCedcoD02EvalScenario(
  input: CreateCedcoD02EvalScenarioInput,
): Result<CedcoD02EvalScenario, DomainError> {
  const evalScenarioId = validateSafeIdentifier(input.evalScenarioId, "evalScenarioId");
  if (!evalScenarioId.ok) {
    return fail(evalScenarioId.error);
  }

  if (input.forbiddenBehavior.trim().length === 0) {
    return fail(domainError("invalid_state", "forbiddenBehavior is required"));
  }

  return ok({
    evalScenarioId: evalScenarioId.value,
    tenantId: input.context.tenantId,
    intent: input.intent,
    objective: input.objective,
    input: input.input,
    expectedBehavior: input.expectedBehavior,
    forbiddenBehavior: input.forbiddenBehavior,
    severity: input.severity,
    metadata: sanitizeMetadata(input.metadata),
  });
}
