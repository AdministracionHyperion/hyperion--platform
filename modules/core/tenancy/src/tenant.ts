import type { TenantId } from "./tenant-id";
import type { TenantStatus } from "./tenant-status";

export interface Tenant {
  readonly tenantId: TenantId;
  readonly name: string;
  readonly status: TenantStatus;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
