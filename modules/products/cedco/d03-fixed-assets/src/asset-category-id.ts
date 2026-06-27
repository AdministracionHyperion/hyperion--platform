import {
  fail,
  ok,
  validateSafeIdentifier,
  type Brand,
  type DomainError,
  type Result,
} from "../../../../../packages/shared/src/core";

export type AssetCategoryId = Brand<string, "AssetCategoryId">;

export function createAssetCategoryId(value: string): Result<AssetCategoryId, DomainError> {
  const validated = validateSafeIdentifier(value, "assetCategoryId");
  if (!validated.ok) {
    return fail(validated.error);
  }

  return ok(validated.value as AssetCategoryId);
}
