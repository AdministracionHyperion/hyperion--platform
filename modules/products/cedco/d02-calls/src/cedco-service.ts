import type { SafeMetadata } from "../../../../../packages/shared/src/core";
import type { CedcoSiteId } from "./cedco-site-id";
import type { CedcoServiceCategory } from "./cedco-service-category";
import type { CedcoServiceId } from "./cedco-service-id";

export interface CedcoService {
  readonly serviceId: CedcoServiceId;
  readonly tenantId: string;
  readonly name: string;
  readonly category: CedcoServiceCategory;
  readonly availableSiteIds: readonly CedcoSiteId[];
  readonly requiresEligibilityCheck: boolean;
  readonly requiresSchedulingIntegration: boolean;
  readonly metadata: SafeMetadata;
}
