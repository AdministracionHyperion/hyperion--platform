import type { CedcoSite } from "./cedco-site";
import type { CedcoSiteId } from "./cedco-site-id";

export interface CedcoSiteRepositoryPort {
  save(site: CedcoSite): Promise<void>;
  findById(tenantId: string, siteId: CedcoSiteId): Promise<CedcoSite | null>;
  findByTenant(tenantId: string): Promise<readonly CedcoSite[]>;
}
