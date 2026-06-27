import type { OperationContext } from "../../../../../packages/shared/src/core";
import type { AssetLocationId } from "./asset-location-id";
import type { AssetMetadata } from "./asset-metadata";
import type { FixedAssetId } from "./fixed-asset-id";

export interface AssetMovement {
  readonly movementId: string;
  readonly tenantId: string;
  readonly assetId: FixedAssetId;
  readonly fromLocationId: AssetLocationId;
  readonly toLocationId: AssetLocationId;
  readonly reason: string;
  readonly occurredAt: Date;
  readonly recordedBy: OperationContext["actorId"];
  readonly metadata: AssetMetadata;
}
