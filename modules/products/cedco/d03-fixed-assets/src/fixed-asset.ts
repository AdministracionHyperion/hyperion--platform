import type { AssetCategoryId } from "./asset-category-id";
import type { AssetCustodianRef } from "./asset-custodian-ref";
import type { AssetLocationId } from "./asset-location-id";
import type { AssetMetadata } from "./asset-metadata";
import type { AssetStatus } from "./asset-status";
import type { AssetTag } from "./asset-tag";
import type { FixedAssetId } from "./fixed-asset-id";

export interface FixedAsset {
  readonly tenantId: string;
  readonly assetId: FixedAssetId;
  readonly tag: AssetTag;
  readonly categoryId: AssetCategoryId;
  readonly currentLocationId: AssetLocationId;
  readonly custodianRef?: AssetCustodianRef;
  readonly status: AssetStatus;
  readonly description: string;
  readonly acquisitionDate?: Date;
  readonly metadata: AssetMetadata;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
