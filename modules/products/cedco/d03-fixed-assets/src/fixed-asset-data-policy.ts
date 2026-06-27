import {
  domainError,
  fail,
  ok,
  type DomainError,
  type Result,
} from "../../../../../packages/shared/src/core";
import { collectUnsafeAssetMetadataReasons } from "./asset-metadata";

export interface FixedAssetDataPolicyInput {
  readonly tenantId: string;
  readonly description: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export function assertFixedAssetDataAllowed(
  input: FixedAssetDataPolicyInput,
): Result<void, DomainError> {
  if (input.tenantId.trim().length === 0) {
    return fail(domainError("invalid_operation_context", "tenantId is required for D03 assets"));
  }

  if (input.description.trim().length === 0) {
    return fail(domainError("invalid_state", "asset description is required"));
  }

  const metadataReasons = collectUnsafeAssetMetadataReasons(input.metadata);
  if (metadataReasons.length > 0) {
    return fail(
      domainError(
        "invalid_metadata",
        `D03 asset data contains blocked fields: ${metadataReasons.join(", ")}`,
      ),
    );
  }

  return ok(undefined);
}
