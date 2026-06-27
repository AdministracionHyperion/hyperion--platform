import {
  domainError,
  fail,
  ok,
  type DomainError,
  type OperationContext,
  type Result,
} from "../../../../../packages/shared/src/core";
import type { VersionRepositoryPort } from "../version-repository.port";
import type { VersionedResource } from "../versioned-resource";

export interface ActivateVersionInput {
  readonly context: OperationContext;
  readonly repository: VersionRepositoryPort;
  readonly versionId: string;
}

export async function activateVersion(
  input: ActivateVersionInput,
): Promise<Result<VersionedResource, DomainError>> {
  const target = await input.repository.findById(input.versionId);
  if (!target) {
    return fail(domainError("not_found", "version not found"));
  }

  if (target.tenantId !== input.context.tenantId) {
    return fail(domainError("tenant_isolation_violation", "version tenant does not match context"));
  }

  const versions = await input.repository.findByResource(
    target.tenantId,
    target.resourceType,
    target.resourceId,
  );

  for (const version of versions) {
    if (version.status === "active" && version.versionId !== target.versionId) {
      await input.repository.save({ ...version, status: "archived" });
    }
  }

  const activated: VersionedResource = {
    ...target,
    status: "active",
    activatedAt: input.context.occurredAt,
  };

  await input.repository.save(activated);
  return ok(activated);
}
