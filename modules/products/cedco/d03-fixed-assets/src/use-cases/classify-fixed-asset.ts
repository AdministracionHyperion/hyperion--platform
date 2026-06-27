import {
  domainError,
  fail,
  ok,
  type DomainError,
  type OperationContext,
  type Result,
} from "../../../../../../packages/shared/src/core";
import { createAssetCategoryId } from "../asset-category-id";
import type { FixedAsset } from "../fixed-asset";
import { createFixedAssetId } from "../fixed-asset-id";
import type { FixedAssetRepositoryPort } from "../fixed-asset-repository.port";

export interface ClassifyFixedAssetInput {
  readonly context: OperationContext;
  readonly repository: FixedAssetRepositoryPort;
  readonly assetId: string;
  readonly categoryId: string;
}

export async function classifyFixedAsset(
  input: ClassifyFixedAssetInput,
): Promise<Result<FixedAsset, DomainError>> {
  const assetId = createFixedAssetId(input.assetId);
  const categoryId = createAssetCategoryId(input.categoryId);
  if (!assetId.ok) return fail(assetId.error);
  if (!categoryId.ok) return fail(categoryId.error);

  const asset = await input.repository.findById(input.context.tenantId, assetId.value);
  if (!asset) {
    return fail(domainError("not_found", "fixed asset not found"));
  }

  const updated: FixedAsset = {
    ...asset,
    categoryId: categoryId.value,
    updatedAt: input.context.occurredAt,
  };

  await input.repository.save(updated);
  return ok(updated);
}
