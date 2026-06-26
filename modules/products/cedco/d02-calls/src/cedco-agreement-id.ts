import {
  validateSafeIdentifier,
  type Brand,
  type DomainError,
  type Result,
} from "../../../../../packages/shared/src/core";

export type CedcoAgreementId = Brand<string, "CedcoAgreementId">;

export function createCedcoAgreementId(value: string): Result<CedcoAgreementId, DomainError> {
  const validated = validateSafeIdentifier(value, "cedcoAgreementId");
  return validated.ok ? { ok: true, value: validated.value as CedcoAgreementId } : validated;
}
