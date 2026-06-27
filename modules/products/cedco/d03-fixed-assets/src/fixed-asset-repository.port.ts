import type { FixedAsset } from "./fixed-asset";
import type { FixedAssetId } from "./fixed-asset-id";

export interface FixedAssetRepositoryPort {
  save(asset: FixedAsset): Promise<void>;
  findById(tenantId: string, assetId: FixedAssetId): Promise<FixedAsset | null>;
  listByTenant(tenantId: string): Promise<readonly FixedAsset[]>;
}
