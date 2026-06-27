import type { AssetMetadata } from "./asset-metadata";
import type { AssetLocationId } from "./asset-location-id";

export interface AssetLocation {
  readonly tenantId: string;
  readonly locationId: AssetLocationId;
  readonly name: string;
  readonly parentLocationId?: AssetLocationId;
  readonly metadata: AssetMetadata;
}
