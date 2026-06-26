import type { VersionId } from "./version-id";
import type { VersionStatus } from "./version-status";

export interface VersionedResource {
  readonly versionId: VersionId;
  readonly tenantId: string;
  readonly resourceType: string;
  readonly resourceId: string;
  readonly versionNumber: number;
  readonly status: VersionStatus;
  readonly createdBy: string;
  readonly createdAt: Date;
  readonly activatedAt?: Date;
}
