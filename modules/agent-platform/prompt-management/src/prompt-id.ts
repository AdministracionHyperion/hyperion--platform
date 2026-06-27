import {
  validateSafeIdentifier,
  type Brand,
  type DomainError,
  type Result,
} from "../../../../packages/shared/src/core";

export type PromptId = Brand<string, "PromptId">;

export function createPromptId(value: string): Result<PromptId, DomainError> {
  const validated = validateSafeIdentifier(value, "promptId");
  return validated.ok ? { ok: true, value: validated.value as PromptId } : validated;
}
