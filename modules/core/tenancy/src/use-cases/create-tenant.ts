import {
  domainError,
  fail,
  ok,
  sanitizeMetadata,
  type DomainError,
  type OperationContext,
  type Result,
} from "../../../../../packages/shared/src/core";
import type { AuditLogPort } from "../../../audit/src/audit-log.port";
import { recordAuditEvent } from "../../../audit/src/use-cases/record-audit-event";
import { createEventEnvelope } from "../../../event-bus/src/event-envelope";
import type { EventBusPort } from "../../../event-bus/src/event-bus.port";
import type { ActorContext } from "../../../identity-access/src/actor-context";
import { authorizeActorAction } from "../../../identity-access/src/use-cases/authorize-actor-action";
import type { Tenant } from "../tenant";
import { createTenantId } from "../tenant-id";
import type { TenantRepositoryPort } from "../tenant-repository.port";
import type { TenantSettings } from "../tenant-settings";

export interface CreateTenantInput {
  readonly tenantId: string;
  readonly name: string;
  readonly actor: ActorContext;
  readonly context: OperationContext;
  readonly repository: TenantRepositoryPort;
  readonly settings?: Omit<TenantSettings, "tenantId">;
  readonly auditLog?: AuditLogPort;
  readonly eventBus?: EventBusPort;
}

export async function createTenant(input: CreateTenantInput): Promise<Result<Tenant, DomainError>> {
  const authorization = authorizeActorAction({
    actor: input.actor,
    context: input.context,
    permission: "platform:tenant:create",
  });

  if (!authorization.ok) {
    return fail(authorization.error);
  }

  const tenantId = createTenantId(input.tenantId);
  if (!tenantId.ok) {
    return fail(tenantId.error);
  }

  if (input.name.trim().length === 0) {
    return fail(domainError("invalid_state", "tenant name must not be empty"));
  }

  const existing = await input.repository.findById(tenantId.value);
  if (existing) {
    return fail(domainError("conflict", "tenant already exists"));
  }

  const now = input.context.occurredAt;
  const tenant: Tenant = {
    tenantId: tenantId.value,
    name: input.name,
    status: "active",
    createdAt: now,
    updatedAt: now,
  };

  const settings = input.settings ? { ...input.settings, tenantId: tenant.tenantId } : undefined;
  await input.repository.save(tenant, settings);

  if (input.eventBus) {
    await input.eventBus.publish(
      createEventEnvelope(input.context, {
        type: "core.tenancy.tenant.created",
        payload: sanitizeMetadata({ tenantId: tenant.tenantId, name: tenant.name }),
        occurredAt: now,
      }),
    );
  }

  if (input.auditLog) {
    await recordAuditEvent(input.auditLog, {
      context: input.context,
      action: "tenant.created",
      resourceType: "tenant",
      resourceId: tenant.tenantId,
      result: "success",
      metadata: { tenantId: tenant.tenantId, name: tenant.name },
    });
  }

  return ok(tenant);
}
