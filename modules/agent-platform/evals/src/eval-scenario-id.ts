import {
  validateSafeIdentifier,
  type Brand,
  type DomainError,
  type Result,
} from "../../../../packages/shared/src/core";

export type EvalScenarioId = Brand<string, "EvalScenarioId">;

export function createEvalScenarioId(value: string): Result<EvalScenarioId, DomainError> {
  const validated = validateSafeIdentifier(value, "evalScenarioId");
  return validated.ok ? { ok: true, value: validated.value as EvalScenarioId } : validated;
}
