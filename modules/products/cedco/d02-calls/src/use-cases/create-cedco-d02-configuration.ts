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
import { createEventEnvelope } from "../../../../../core/event-bus/src";
import type { EventBusPort } from "../../../../../core/event-bus/src/event-bus.port";
import type { ActorContext } from "../../../../../core/identity-access/src/actor-context";
import { rolesAllow } from "../../../../../core/identity-access/src/rbac-policy";
import type { CedcoD02Configuration, CedcoD02IntegrationMode } from "../cedco-d02-configuration";
import type { CedcoD02ConfigurationRepositoryPort } from "../cedco-d02-configuration-repository.port";
import { createCedcoServiceId } from "../cedco-service-id";
import { createCedcoSiteId } from "../cedco-site-id";

export interface CreateCedcoD02ConfigurationInput {
  readonly context: OperationContext;
  readonly actor: ActorContext;
  readonly repository: CedcoD02ConfigurationRepositoryPort;
  readonly activeAgentVersionId?: string;
  readonly activePromptVersionId?: string;
  readonly activeFlowVersionId?: string;
  readonly activeKnowledgeBaseVersionId?: string;
  readonly allowedSiteIds?: readonly string[];
  readonly allowedServiceIds?: readonly string[];
  readonly handoffEnabled?: boolean;
  readonly schedulingMode?: CedcoD02IntegrationMode;
  readonly eligibilityMode?: CedcoD02IntegrationMode;
  readonly metadata?: Readonly<Record<string, unknown>>;
  readonly auditLog?: AuditLogPort;
  readonly eventBus?: EventBusPort;
}

export async function createCedcoD02Configuration(
  input: CreateCedcoD02ConfigurationInput,
): Promise<Result<CedcoD02Configuration, DomainError>> {
  if (
    !rolesAllow(input.actor.roles, "tenant:update") &&
    !rolesAllow(input.actor.roles, "agent:write")
  ) {
    return fail({ code: "forbidden", message: "actor cannot configure CEDCO D02" });
  }

  const allowedSiteIds = [];
  for (const rawSiteId of input.allowedSiteIds ?? []) {
    const siteId = createCedcoSiteId(rawSiteId);
    if (!siteId.ok) {
      return fail(siteId.error);
    }
    allowedSiteIds.push(siteId.value);
  }

  const allowedServiceIds = [];
  for (const rawServiceId of input.allowedServiceIds ?? []) {
    const serviceId = createCedcoServiceId(rawServiceId);
    if (!serviceId.ok) {
      return fail(serviceId.error);
    }
    allowedServiceIds.push(serviceId.value);
  }

  const configuration: CedcoD02Configuration = {
    tenantId: input.context.tenantId,
    defaultLocale: "es-CO",
    activeAgentVersionId: input.activeAgentVersionId,
    activePromptVersionId: input.activePromptVersionId,
    activeFlowVersionId: input.activeFlowVersionId,
    activeKnowledgeBaseVersionId: input.activeKnowledgeBaseVersionId,
    allowedSiteIds,
    allowedServiceIds,
    handoffEnabled: input.handoffEnabled ?? true,
    schedulingMode: input.schedulingMode ?? "disabled",
    eligibilityMode: input.eligibilityMode ?? "disabled",
    realCallsEnabled: false,
    metadata: sanitizeMetadata(input.metadata),
  };

  await input.repository.save(configuration);

  if (input.auditLog) {
    await recordAuditEvent(input.auditLog, {
      context: input.context,
      action: "cedco.d02.configuration.created",
      resourceType: "cedco_d02_configuration",
      resourceId: input.context.tenantId,
      result: "success",
      metadata: {
        schedulingMode: configuration.schedulingMode,
        eligibilityMode: configuration.eligibilityMode,
      },
    });
  }

  if (input.eventBus) {
    await input.eventBus.publish(
      createEventEnvelope(input.context, {
        type: "cedco.d02.configuration.created",
        payload: sanitizeMetadata({ tenantId: input.context.tenantId }),
        occurredAt: input.context.occurredAt,
      }),
    );
  }

  return ok(configuration);
}
