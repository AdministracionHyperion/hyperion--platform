import type { SafeMetadata } from "../../../../../packages/shared/src/core";
import type { CedcoSiteId } from "./cedco-site-id";
import type { CedcoSiteStatus } from "./cedco-site-status";

export interface CedcoSite {
  readonly siteId: CedcoSiteId;
  readonly tenantId: string;
  readonly name: string;
  readonly city: string;
  readonly status: CedcoSiteStatus;
  readonly timezone: string;
  readonly metadata: SafeMetadata;
}
