import {
  fail,
  ok,
  validateSafeIdentifier,
  type Brand,
  type DomainError,
  type Result,
} from "../../../../../packages/shared/src/core";

export type FixedAssetId = Brand<string, "FixedAssetId">;

export function createFixedAssetId(value: string): Result<FixedAssetId, DomainError> {
  const validated = validateSafeIdentifier(value, "fixedAssetId");
  if (!validated.ok) {
    return fail(validated.error);
  }

  return ok(validated.value as FixedAssetId);
}
