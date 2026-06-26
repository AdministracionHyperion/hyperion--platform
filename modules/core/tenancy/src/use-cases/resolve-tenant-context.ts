import {
  domainError,
  fail,
  ok,
  type DomainError,
  type Result,
} from "../../../../../packages/shared/src/core";
import type { TenantContext } from "../tenant-context";
import { createTenantId } from "../tenant-id";
import type { TenantRepositoryPort } from "../tenant-repository.port";

export interface ResolveTenantContextInput {
  readonly tenantId: string;
  readonly repository: TenantRepositoryPort;
}

export async function resolveTenantContext(
  input: ResolveTenantContextInput,
): Promise<Result<TenantContext, DomainError>> {
  const tenantId = createTenantId(input.tenantId);
  if (!tenantId.ok) {
    return fail(tenantId.error);
  }

  const tenant = await input.repository.findById(tenantId.value);
  if (!tenant) {
    return fail(domainError("not_found", "tenant not found"));
  }

  if (tenant.status !== "active") {
    return fail(domainError("invalid_state", "tenant is not active"));
  }

  return ok({
    tenant,
    settings: (await input.repository.findSettings(tenant.tenantId)) ?? undefined,
  });
}
