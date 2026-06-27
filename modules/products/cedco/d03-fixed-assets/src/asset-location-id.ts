import {
  fail,
  ok,
  validateSafeIdentifier,
  type Brand,
  type DomainError,
  type Result,
} from "../../../../../packages/shared/src/core";

export type AssetLocationId = Brand<string, "AssetLocationId">;

export function createAssetLocationId(value: string): Result<AssetLocationId, DomainError> {
  const validated = validateSafeIdentifier(value, "assetLocationId");
  if (!validated.ok) {
    return fail(validated.error);
  }

  return ok(validated.value as AssetLocationId);
}
