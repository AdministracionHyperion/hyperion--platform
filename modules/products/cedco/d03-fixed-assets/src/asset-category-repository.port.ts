import type { AssetCategory } from "./asset-category";
import type { AssetCategoryId } from "./asset-category-id";

export interface AssetCategoryRepositoryPort {
  save(category: AssetCategory): Promise<void>;
  findById(tenantId: string, categoryId: AssetCategoryId): Promise<AssetCategory | null>;
  listByTenant(tenantId: string): Promise<readonly AssetCategory[]>;
}
