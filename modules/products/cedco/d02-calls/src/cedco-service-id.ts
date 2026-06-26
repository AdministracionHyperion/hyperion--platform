import {
  validateSafeIdentifier,
  type Brand,
  type DomainError,
  type Result,
} from "../../../../../packages/shared/src/core";

export type CedcoServiceId = Brand<string, "CedcoServiceId">;

export function createCedcoServiceId(value: string): Result<CedcoServiceId, DomainError> {
  const validated = validateSafeIdentifier(value, "cedcoServiceId");
  return validated.ok ? { ok: true, value: validated.value as CedcoServiceId } : validated;
}
