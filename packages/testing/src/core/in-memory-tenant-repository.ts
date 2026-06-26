import type { Tenant } from "../../../../modules/core/tenancy/src/tenant";
import type { TenantId } from "../../../../modules/core/tenancy/src/tenant-id";
import type { TenantRepositoryPort } from "../../../../modules/core/tenancy/src/tenant-repository.port";
import type { TenantSettings } from "../../../../modules/core/tenancy/src/tenant-settings";

export class InMemoryTenantRepository implements TenantRepositoryPort {
  private readonly tenants = new Map<string, Tenant>();
  private readonly settings = new Map<string, TenantSettings>();

  async save(tenant: Tenant, settings?: TenantSettings): Promise<void> {
    this.tenants.set(tenant.tenantId, tenant);

    if (settings) {
      this.settings.set(tenant.tenantId, settings);
    }
  }

  async findById(tenantId: TenantId): Promise<Tenant | null> {
    return this.tenants.get(tenantId) ?? null;
  }

  async findSettings(tenantId: TenantId): Promise<TenantSettings | null> {
    return this.settings.get(tenantId) ?? null;
  }
}
