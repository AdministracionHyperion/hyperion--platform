import type { VersionedResource } from "./versioned-resource";

export interface VersionRepositoryPort {
  save(version: VersionedResource): Promise<void>;
  findById(versionId: string): Promise<VersionedResource | null>;
  findByResource(
    tenantId: string,
    resourceType: string,
    resourceId: string,
  ): Promise<readonly VersionedResource[]>;
}
