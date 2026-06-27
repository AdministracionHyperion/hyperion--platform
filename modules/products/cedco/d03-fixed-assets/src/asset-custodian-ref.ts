import {
  fail,
  ok,
  validateSafeIdentifier,
  type Brand,
  type DomainError,
  type Result,
} from "../../../../../packages/shared/src/core";

export type AssetCustodianRef = Brand<string, "AssetCustodianRef">;

export function createAssetCustodianRef(value: string): Result<AssetCustodianRef, DomainError> {
  const validated = validateSafeIdentifier(value, "assetCustodianRef");
  if (!validated.ok) {
    return fail(validated.error);
  }

  return ok(validated.value as AssetCustodianRef);
}
