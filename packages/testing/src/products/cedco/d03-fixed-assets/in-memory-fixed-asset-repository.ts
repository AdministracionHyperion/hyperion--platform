import type {
  FixedAsset,
  FixedAssetId,
  FixedAssetRepositoryPort,
} from "../../../../../../modules/products/cedco/d03-fixed-assets/src";

export class InMemoryFixedAssetRepository implements FixedAssetRepositoryPort {
  private readonly assets = new Map<string, FixedAsset>();

  async save(asset: FixedAsset): Promise<void> {
    this.assets.set(this.key(asset.tenantId, asset.assetId), asset);
  }

  async findById(tenantId: string, assetId: FixedAssetId): Promise<FixedAsset | null> {
    return this.assets.get(this.key(tenantId, assetId)) ?? null;
  }

  async listByTenant(tenantId: string): Promise<readonly FixedAsset[]> {
    return [...this.assets.values()].filter((asset) => asset.tenantId === tenantId);
  }

  clear(): void {
    this.assets.clear();
  }

  private key(tenantId: string, assetId: FixedAssetId): string {
    return `${tenantId}:${assetId}`;
  }
}
