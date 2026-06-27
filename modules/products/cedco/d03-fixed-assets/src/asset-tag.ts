import {
  fail,
  ok,
  validateSafeIdentifier,
  type Brand,
  type DomainError,
  type Result,
} from "../../../../../packages/shared/src/core";

export type AssetTag = Brand<string, "AssetTag">;

export function createAssetTag(value: string): Result<AssetTag, DomainError> {
  const validated = validateSafeIdentifier(value, "assetTag");
  if (!validated.ok) {
    return fail(validated.error);
  }

  return ok(validated.value as AssetTag);
}
