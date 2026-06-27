import {
  domainError,
  fail,
  ok,
  validateSafeIdentifier,
  type Brand,
  type DomainError,
  type Result,
} from "../../../../../packages/shared/src/core";

export type CedcoConsentRef = Brand<string, "CedcoConsentRef">;

export function createCedcoConsentRef(value: string): Result<CedcoConsentRef, DomainError> {
  const validated = validateSafeIdentifier(value, "cedcoConsentRef");
  if (!validated.ok) {
    return fail(validated.error);
  }

  if (/^\d{6,}$/u.test(validated.value) || validated.value.includes("phone")) {
    return fail(domainError("invalid_id", "cedcoConsentRef must not contain PII"));
  }

  return ok(validated.value as CedcoConsentRef);
}
