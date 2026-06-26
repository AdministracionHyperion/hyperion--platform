import type { Tenant } from "./tenant";
import type { TenantSettings } from "./tenant-settings";

export interface TenantContext {
  readonly tenant: Tenant;
  readonly settings?: TenantSettings;
}
