import {
  domainError,
  fail,
  ok,
  validateSafeIdentifier,
  type Brand,
  type DomainError,
  type Result,
} from "../../../../packages/shared/src/core";

export type CalleeAlias = Brand<string, "CalleeAlias">;

export function createCalleeAlias(value: string): Result<CalleeAlias, DomainError> {
  const validation = validateSafeIdentifier(value, "calleeAlias");
  if (!validation.ok) {
    return fail(validation.error);
  }

  if (looksLikeRealPhoneAlias(value)) {
    return fail(domainError("invalid_id", "calleeAlias must not contain a real phone number"));
  }

  return ok(validation.value as CalleeAlias);
}

export function looksLikeRealPhoneAlias(value: string): boolean {
  const lower = value.toLowerCase();
  return (
    lower.includes("+57") ||
    lower.includes("+") ||
    lower.includes("phone") ||
    lower.includes("tel") ||
    lower.includes("celular") ||
    /^\d{8,}$/u.test(value.replaceAll("-", ""))
  );
}
