import { ok, type OperationContext, type Result } from "../../../../../packages/shared/src/core";
import { createVersionId } from "../version-id";
import type { VersionRepositoryPort } from "../version-repository.port";
import type { VersionedResource } from "../versioned-resource";

export interface CreateVersionDraftInput {
  readonly context: OperationContext;
  readonly repository: VersionRepositoryPort;
  readonly resourceType: string;
  readonly resourceId: string;
}

export async function createVersionDraft(
  input: CreateVersionDraftInput,
): Promise<Result<VersionedResource, never>> {
  const existingVersions = await input.repository.findByResource(
    input.context.tenantId,
    input.resourceType,
    input.resourceId,
  );
  const versionNumber =
    Math.max(0, ...existingVersions.map((version) => version.versionNumber)) + 1;

  const draft: VersionedResource = {
    versionId: createVersionId(),
    tenantId: input.context.tenantId,
    resourceType: input.resourceType,
    resourceId: input.resourceId,
    versionNumber,
    status: "draft",
    createdBy: input.context.actorId,
    createdAt: input.context.occurredAt,
  };

  await input.repository.save(draft);
  return ok(draft);
}
