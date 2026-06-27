import {
  validateSafeIdentifier,
  type Brand,
  type DomainError,
  type Result,
} from "../../../../packages/shared/src/core";

export type CallId = Brand<string, "CallId">;

export function createCallId(value: string): Result<CallId, DomainError> {
  const validated = validateSafeIdentifier(value, "callId");
  return validated.ok ? { ok: true, value: validated.value as CallId } : validated;
}
