import {
  domainError,
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
import type { CedcoService } from "../cedco-service";
import type { CedcoServiceCategory } from "../cedco-service-category";
import { createCedcoServiceId } from "../cedco-service-id";
import type { CedcoServiceRepositoryPort } from "../cedco-service-repository.port";
import { createCedcoSiteId, type CedcoSiteId } from "../cedco-site-id";

export interface RegisterCedcoServiceInput {
  readonly context: OperationContext;
  readonly actor: ActorContext;
  readonly repository: CedcoServiceRepositoryPort;
  readonly serviceId: string;
  readonly name: string;
  readonly category: CedcoServiceCategory;
  readonly availableSiteIds: readonly string[];
  readonly allowedSiteIds: readonly CedcoSiteId[];
  readonly requiresEligibilityCheck?: boolean;
  readonly requiresSchedulingIntegration?: boolean;
  readonly metadata?: Readonly<Record<string, unknown>>;
  readonly auditLog?: AuditLogPort;
}

export async function registerCedcoService(
  input: RegisterCedcoServiceInput,
): Promise<Result<CedcoService, DomainError>> {
  if (!rolesAllow(input.actor.roles, "tenant:update")) {
    return fail({ code: "forbidden", message: "actor cannot register CEDCO service" });
  }

  const serviceId = createCedcoServiceId(input.serviceId);
  if (!serviceId.ok) {
    return fail(serviceId.error);
  }

  const availableSiteIds = [];
  for (const rawSiteId of input.availableSiteIds) {
    const siteId = createCedcoSiteId(rawSiteId);
    if (!siteId.ok) {
      return fail(siteId.error);
    }
    if (!input.allowedSiteIds.includes(siteId.value)) {
      return fail(domainError("invalid_state", "service references a site outside the allowlist"));
    }
    availableSiteIds.push(siteId.value);
  }

  const service: CedcoService = {
    serviceId: serviceId.value,
    tenantId: input.context.tenantId,
    name: input.name,
    category: input.category,
    availableSiteIds,
    requiresEligibilityCheck: input.requiresEligibilityCheck ?? false,
    requiresSchedulingIntegration: input.requiresSchedulingIntegration ?? false,
    metadata: sanitizeMetadata(input.metadata),
  };

  await input.repository.save(service);

  if (input.auditLog) {
    await recordAuditEvent(input.auditLog, {
      context: input.context,
      action: "cedco.service.registered",
      resourceType: "cedco_service",
      resourceId: service.serviceId,
      result: "success",
      metadata: { serviceId: service.serviceId },
    });
  }

  return ok(service);
}
