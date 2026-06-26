import {
  domainError,
  fail,
  ok,
  validateSafeIdentifier,
  type Brand,
  type DomainError,
  type Result,
} from "../../../../../packages/shared/src/core";

export type CedcoPatientContextRef = Brand<string, "CedcoPatientContextRef">;

export function createCedcoPatientContextRef(
  value: string,
): Result<CedcoPatientContextRef, DomainError> {
  const validated = validateSafeIdentifier(value, "cedcoPatientContextRef");
  if (!validated.ok) {
    return fail(validated.error);
  }

  if (looksLikePersonalReference(validated.value)) {
    return fail(domainError("invalid_id", "cedcoPatientContextRef must not contain PII"));
  }

  return ok(validated.value as CedcoPatientContextRef);
}

function looksLikePersonalReference(value: string): boolean {
  return /^\d{6,}$/u.test(value) || value.includes("phone") || value.includes("email");
}
