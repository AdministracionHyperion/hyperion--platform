import {
  validateSafeIdentifier,
  type Brand,
  type DomainError,
  type Result,
} from "../../../../packages/shared/src/core";

export type ProviderEventId = Brand<string, "ProviderEventId">;

export function createProviderEventId(value: string): Result<ProviderEventId, DomainError> {
  const result = validateSafeIdentifier(value, "providerEventId");
  return result.ok ? { ok: true, value: result.value as ProviderEventId } : result;
}
