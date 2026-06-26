import type { TenantId } from "./tenant-id";

export type TenantPiiPolicy = "standard" | "strict";

export interface TenantSettings {
  readonly tenantId: TenantId;
  readonly locale: string;
  readonly timezone: string;
  readonly dataRetentionDays: number;
  readonly piiPolicy: TenantPiiPolicy;
}
