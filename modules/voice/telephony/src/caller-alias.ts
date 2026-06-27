import {
  domainError,
  fail,
  ok,
  validateSafeIdentifier,
  type Brand,
  type DomainError,
  type Result,
} from "../../../../packages/shared/src/core";
import { looksLikeRealPhoneAlias } from "./callee-alias";

export type CallerAlias = Brand<string, "CallerAlias">;

export function createCallerAlias(value: string): Result<CallerAlias, DomainError> {
  const validation = validateSafeIdentifier(value, "callerAlias");
  if (!validation.ok) {
    return fail(validation.error);
  }

  if (looksLikeRealPhoneAlias(value)) {
    return fail(domainError("invalid_id", "callerAlias must not contain a real phone number"));
  }

  return ok(validation.value as CallerAlias);
}
