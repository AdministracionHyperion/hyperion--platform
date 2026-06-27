import type { AssetLocation } from "./asset-location";
import type { AssetLocationId } from "./asset-location-id";

export interface AssetLocationRepositoryPort {
  save(location: AssetLocation): Promise<void>;
  findById(tenantId: string, locationId: AssetLocationId): Promise<AssetLocation | null>;
  listByTenant(tenantId: string): Promise<readonly AssetLocation[]>;
}
