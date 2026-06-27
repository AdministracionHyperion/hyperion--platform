import {
  domainError,
  fail,
  ok,
  type DomainError,
  type OperationContext,
  type Result,
} from "../../../../../../packages/shared/src/core";
import type { AssetMovement } from "../asset-movement";
import { assertAssetMovementAllowed } from "../asset-movement-policy";
import { createAssetLocationId } from "../asset-location-id";
import { createAssetMetadata } from "../asset-metadata";
import type { FixedAsset } from "../fixed-asset";
import { createFixedAssetId } from "../fixed-asset-id";
import type { FixedAssetRepositoryPort } from "../fixed-asset-repository.port";

export interface MoveFixedAssetInput {
  readonly context: OperationContext;
  readonly repository: FixedAssetRepositoryPort;
  readonly assetId: string;
  readonly toLocationId: string;
  readonly reason: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface MoveFixedAssetResult {
  readonly asset: FixedAsset;
  readonly movement: AssetMovement;
}

export async function moveFixedAsset(
  input: MoveFixedAssetInput,
): Promise<Result<MoveFixedAssetResult, DomainError>> {
  const assetId = createFixedAssetId(input.assetId);
  const toLocationId = createAssetLocationId(input.toLocationId);
  const metadata = createAssetMetadata(input.metadata);
  if (!assetId.ok) return fail(assetId.error);
  if (!toLocationId.ok) return fail(toLocationId.error);
  if (!metadata.ok) return fail(metadata.error);

  if (input.reason.trim().length === 0) {
    return fail(domainError("invalid_state", "movement reason is required"));
  }

  const asset = await input.repository.findById(input.context.tenantId, assetId.value);
  if (!asset) {
    return fail(domainError("not_found", "fixed asset not found"));
  }

  const movementPolicy = assertAssetMovementAllowed(asset);
  if (!movementPolicy.ok) {
    return fail(movementPolicy.error);
  }

  const movement: AssetMovement = {
    movementId: `movement-${asset.assetId}-${input.context.correlationId}`,
    tenantId: input.context.tenantId,
    assetId: asset.assetId,
    fromLocationId: asset.currentLocationId,
    toLocationId: toLocationId.value,
    reason: input.reason,
    occurredAt: input.context.occurredAt,
    recordedBy: input.context.actorId,
    metadata: metadata.value,
  };

  const updated: FixedAsset = {
    ...asset,
    currentLocationId: toLocationId.value,
    updatedAt: input.context.occurredAt,
  };

  await input.repository.save(updated);
  return ok({ asset: updated, movement });
}
