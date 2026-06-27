import type {
  CedcoSite,
  CedcoSiteId,
  CedcoSiteRepositoryPort,
} from "../../../../../../modules/products/cedco/d02-calls/src";

export class InMemoryCedcoSiteRepository implements CedcoSiteRepositoryPort {
  private readonly sites = new Map<string, CedcoSite>();

  async save(site: CedcoSite): Promise<void> {
    this.sites.set(key(site.tenantId, site.siteId), site);
  }

  async findById(tenantId: string, siteId: CedcoSiteId): Promise<CedcoSite | null> {
    return this.sites.get(key(tenantId, siteId)) ?? null;
  }

  async findByTenant(tenantId: string): Promise<readonly CedcoSite[]> {
    return [...this.sites.values()].filter((site) => site.tenantId === tenantId);
  }
}

function key(tenantId: string, id: string): string {
  return `${tenantId}:${id}`;
}
