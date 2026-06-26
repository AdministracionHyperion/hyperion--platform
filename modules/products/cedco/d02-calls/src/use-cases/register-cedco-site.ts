import {
  fail,
  ok,
  sanitizeMetadata,
  type DomainError,
  type OperationContext,
  type Result,
} from "../../../../../../packages/shared/src/core";
import type { AuditLogPort } from "../../../../../core/audit/src/audit-log.port";
import { recordAuditEvent } from "../../../../../core/audit/src/use-cases/record-audit-event";
import type { ActorContext } from "../../../../../core/identity-access/src/actor-context";
import { rolesAllow } from "../../../../../core/identity-access/src/rbac-policy";
import type { CedcoSite } from "../cedco-site";
import type { CedcoSiteRepositoryPort } from "../cedco-site-repository.port";
import type { CedcoSiteStatus } from "../cedco-site-status";
import { createCedcoSiteId } from "../cedco-site-id";

export interface RegisterCedcoSiteInput {
  readonly context: OperationContext;
  readonly actor: ActorContext;
  readonly repository: CedcoSiteRepositoryPort;
  readonly siteId: string;
  readonly name: string;
  readonly city: string;
  readonly status?: CedcoSiteStatus;
  readonly timezone?: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
  readonly auditLog?: AuditLogPort;
}

export async function registerCedcoSite(
  input: RegisterCedcoSiteInput,
): Promise<Result<CedcoSite, DomainError>> {
  if (!rolesAllow(input.actor.roles, "tenant:update")) {
    return fail({ code: "forbidden", message: "actor cannot register CEDCO site" });
  }

  const siteId = createCedcoSiteId(input.siteId);
  if (!siteId.ok) {
    return fail(siteId.error);
  }

  const site: CedcoSite = {
    siteId: siteId.value,
    tenantId: input.context.tenantId,
    name: input.name,
    city: input.city,
    status: input.status ?? "active",
    timezone: input.timezone ?? "America/Bogota",
    metadata: sanitizeMetadata(input.metadata),
  };

  await input.repository.save(site);

  if (input.auditLog) {
    await recordAuditEvent(input.auditLog, {
      context: input.context,
      action: "cedco.site.registered",
      resourceType: "cedco_site",
      resourceId: site.siteId,
      result: "success",
      metadata: { siteId: site.siteId },
    });
  }

  return ok(site);
}
