import {
  domainError,
  fail,
  ok,
  type DomainError,
  type Result,
} from "../../../../../packages/shared/src/core";
import type { FixedAsset } from "./fixed-asset";

export function assertAssetMovementAllowed(asset: FixedAsset): Result<void, DomainError> {
  if (asset.status === "disposed") {
    return fail(domainError("invalid_state", "disposed assets cannot be moved"));
  }

  if (asset.status === "retired") {
    return fail(domainError("invalid_state", "retired assets cannot be moved"));
  }

  return ok(undefined);
}
