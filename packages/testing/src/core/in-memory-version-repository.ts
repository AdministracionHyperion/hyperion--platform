import type { VersionRepositoryPort } from "../../../../modules/core/versioning/src/version-repository.port";
import type { VersionedResource } from "../../../../modules/core/versioning/src/versioned-resource";

export class InMemoryVersionRepository implements VersionRepositoryPort {
  private readonly versions = new Map<string, VersionedResource>();

  async save(version: VersionedResource): Promise<void> {
    this.versions.set(version.versionId, version);
  }

  async findById(versionId: string): Promise<VersionedResource | null> {
    return this.versions.get(versionId) ?? null;
  }

  async findByResource(
    tenantId: string,
    resourceType: string,
    resourceId: string,
  ): Promise<readonly VersionedResource[]> {
    return [...this.versions.values()].filter(
      (version) =>
        version.tenantId === tenantId &&
        version.resourceType === resourceType &&
        version.resourceId === resourceId,
    );
  }
}
