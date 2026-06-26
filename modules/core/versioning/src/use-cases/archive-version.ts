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

export interface ArchiveVersionInput {
  readonly context: OperationContext;
  readonly repository: VersionRepositoryPort;
  readonly versionId: string;
}

export async function archiveVersion(
  input: ArchiveVersionInput,
): Promise<Result<VersionedResource, DomainError>> {
  const target = await input.repository.findById(input.versionId);
  if (!target) {
    return fail(domainError("not_found", "version not found"));
  }

  if (target.tenantId !== input.context.tenantId) {
    return fail(domainError("tenant_isolation_violation", "version tenant does not match context"));
  }

  const archived: VersionedResource = { ...target, status: "archived" };
  await input.repository.save(archived);
  return ok(archived);
}
