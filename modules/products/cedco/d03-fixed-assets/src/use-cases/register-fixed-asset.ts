import {
  domainError,
  fail,
  ok,
  type DomainError,
  type OperationContext,
  type Result,
} from "../../../../../../packages/shared/src/core";
import { createAssetCategoryId } from "../asset-category-id";
import { createAssetCustodianRef } from "../asset-custodian-ref";
import { createAssetLocationId } from "../asset-location-id";
import { createAssetMetadata } from "../asset-metadata";
import { createAssetTag } from "../asset-tag";
import type { FixedAsset } from "../fixed-asset";
import { assertFixedAssetDataAllowed } from "../fixed-asset-data-policy";
import { createFixedAssetId } from "../fixed-asset-id";
import type { FixedAssetRepositoryPort } from "../fixed-asset-repository.port";

export interface RegisterFixedAssetInput {
  readonly context: OperationContext;
  readonly repository: FixedAssetRepositoryPort;
  readonly assetId: string;
  readonly tag: string;
  readonly categoryId: string;
  readonly locationId: string;
  readonly custodianRef?: string;
  readonly description: string;
  readonly acquisitionDate?: Date;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export async function registerFixedAsset(
  input: RegisterFixedAssetInput,
): Promise<Result<FixedAsset, DomainError>> {
  const dataPolicy = assertFixedAssetDataAllowed({
    tenantId: input.context.tenantId,
    description: input.description,
    metadata: input.metadata,
  });
  if (!dataPolicy.ok) {
    return fail(dataPolicy.error);
  }

  const assetId = createFixedAssetId(input.assetId);
  const tag = createAssetTag(input.tag);
  const categoryId = createAssetCategoryId(input.categoryId);
  const locationId = createAssetLocationId(input.locationId);
  const metadata = createAssetMetadata(input.metadata);

  if (!assetId.ok) return fail(assetId.error);
  if (!tag.ok) return fail(tag.error);
  if (!categoryId.ok) return fail(categoryId.error);
  if (!locationId.ok) return fail(locationId.error);
  if (!metadata.ok) return fail(metadata.error);

  const custodianRef =
    input.custodianRef === undefined ? undefined : createAssetCustodianRef(input.custodianRef);
  if (custodianRef !== undefined && !custodianRef.ok) {
    return fail(custodianRef.error);
  }

  const existing = await input.repository.findById(input.context.tenantId, assetId.value);
  if (existing) {
    return fail(domainError("conflict", "fixed asset already exists"));
  }

  const now = input.context.occurredAt;
  const asset: FixedAsset = {
    tenantId: input.context.tenantId,
    assetId: assetId.value,
    tag: tag.value,
    categoryId: categoryId.value,
    currentLocationId: locationId.value,
    custodianRef: custodianRef?.value,
    status: "draft",
    description: input.description,
    acquisitionDate: input.acquisitionDate,
    metadata: metadata.value,
    createdAt: now,
    updatedAt: now,
  };

  await input.repository.save(asset);
  return ok(asset);
}
