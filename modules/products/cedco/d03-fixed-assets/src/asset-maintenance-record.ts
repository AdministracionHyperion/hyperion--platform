import type { AssetMetadata } from "./asset-metadata";
import type { FixedAssetId } from "./fixed-asset-id";

export interface AssetMaintenanceRecord {
  readonly maintenanceId: string;
  readonly tenantId: string;
  readonly assetId: FixedAssetId;
  readonly maintenanceType: "preventive" | "corrective" | "inspection";
  readonly status: "planned" | "recorded";
  readonly summary: string;
  readonly occurredAt: Date;
  readonly metadata: AssetMetadata;
}
