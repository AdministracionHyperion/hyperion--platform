import type { AssetMetadata } from "./asset-metadata";
import type { FixedAssetId } from "./fixed-asset-id";

export interface AssetAuditEvent {
  readonly auditId: string;
  readonly tenantId: string;
  readonly assetId: FixedAssetId;
  readonly action: string;
  readonly actorId: string;
  readonly occurredAt: Date;
  readonly metadata: AssetMetadata;
}
