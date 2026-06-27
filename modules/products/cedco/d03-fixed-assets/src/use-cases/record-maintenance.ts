import {
  domainError,
  fail,
  ok,
  type DomainError,
  type OperationContext,
  type Result,
} from "../../../../../../packages/shared/src/core";
import type { AssetMaintenanceRecord } from "../asset-maintenance-record";
import { createAssetMetadata } from "../asset-metadata";
import type { FixedAsset } from "../fixed-asset";
import { createFixedAssetId } from "../fixed-asset-id";
import type { FixedAssetRepositoryPort } from "../fixed-asset-repository.port";

export interface RecordMaintenanceInput {
  readonly context: OperationContext;
  readonly repository: FixedAssetRepositoryPort;
  readonly assetId: string;
  readonly maintenanceType: AssetMaintenanceRecord["maintenanceType"];
  readonly summary: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface RecordMaintenanceResult {
  readonly asset: FixedAsset;
  readonly maintenance: AssetMaintenanceRecord;
}

export async function recordMaintenance(
  input: RecordMaintenanceInput,
): Promise<Result<RecordMaintenanceResult, DomainError>> {
  const assetId = createFixedAssetId(input.assetId);
  const metadata = createAssetMetadata(input.metadata);
  if (!assetId.ok) return fail(assetId.error);
  if (!metadata.ok) return fail(metadata.error);

  if (input.summary.trim().length === 0) {
    return fail(domainError("invalid_state", "maintenance summary is required"));
  }

  const asset = await input.repository.findById(input.context.tenantId, assetId.value);
  if (!asset) {
    return fail(domainError("not_found", "fixed asset not found"));
  }

  const maintenance: AssetMaintenanceRecord = {
    maintenanceId: `maintenance-${asset.assetId}-${input.context.correlationId}`,
    tenantId: input.context.tenantId,
    assetId: asset.assetId,
    maintenanceType: input.maintenanceType,
    status: "recorded",
    summary: input.summary,
    occurredAt: input.context.occurredAt,
    metadata: metadata.value,
  };

  const updated: FixedAsset = {
    ...asset,
    status: "in-maintenance",
    updatedAt: input.context.occurredAt,
  };

  await input.repository.save(updated);
  return ok({ asset: updated, maintenance });
}
