import type { AssetMetadata } from "./asset-metadata";
import type { AssetCategoryId } from "./asset-category-id";

export interface AssetCategory {
  readonly tenantId: string;
  readonly categoryId: AssetCategoryId;
  readonly name: string;
  readonly usefulLifeMonths?: number;
  readonly metadata: AssetMetadata;
}
