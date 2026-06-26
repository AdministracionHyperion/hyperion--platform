import type { Tenant } from "./tenant";
import type { TenantId } from "./tenant-id";
import type { TenantSettings } from "./tenant-settings";

export interface TenantRepositoryPort {
  save(tenant: Tenant, settings?: TenantSettings): Promise<void>;
  findById(tenantId: TenantId): Promise<Tenant | null>;
  findSettings(tenantId: TenantId): Promise<TenantSettings | null>;
}
