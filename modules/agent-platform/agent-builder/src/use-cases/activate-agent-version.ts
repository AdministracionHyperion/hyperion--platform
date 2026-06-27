import {
  domainError,
  fail,
  ok,
  sanitizeMetadata,
  type DomainError,
  type OperationContext,
  type Result,
} from "../../../../../packages/shared/src/core";
import type { AuditLogPort } from "../../../../core/audit/src/audit-log.port";
import { recordAuditEvent } from "../../../../core/audit/src/use-cases/record-audit-event";
import { createEventEnvelope } from "../../../../core/event-bus/src/event-envelope";
import type { EventBusPort } from "../../../../core/event-bus/src/event-bus.port";
import type { ActorContext } from "../../../../core/identity-access/src/actor-context";
import { rolesAllow } from "../../../../core/identity-access/src/rbac-policy";
import type { AgentVersion, AgentVersionId } from "../agent-version";
import type { AgentVersionRepositoryPort } from "../agent-version-repository.port";

export interface ActivateAgentVersionInput {
  readonly context: OperationContext;
  readonly actor: ActorContext;
  readonly repository: AgentVersionRepositoryPort;
  readonly agentVersionId: AgentVersionId;
  readonly auditLog?: AuditLogPort;
  readonly eventBus?: EventBusPort;
}

export async function activateAgentVersion(
  input: ActivateAgentVersionInput,
): Promise<Result<AgentVersion, DomainError>> {
  if (
    !rolesAllow(input.actor.roles, "version:activate") &&
    !rolesAllow(input.actor.roles, "agent:write")
  ) {
    return fail(domainError("forbidden", "actor cannot activate agent version"));
  }

  const target = await input.repository.findById(input.context.tenantId, input.agentVersionId);
  if (!target) {
    return fail(domainError("not_found", "agent version not found"));
  }

  const versions = await input.repository.findByAgent(input.context.tenantId, target.agentId);
  for (const version of versions) {
    if (version.status === "active" && version.agentVersionId !== target.agentVersionId) {
      await input.repository.save({ ...version, status: "archived" });
    }
  }

  const activated: AgentVersion = {
    ...target,
    status: "active",
    activatedAt: input.context.occurredAt,
  };
  await input.repository.save(activated);

  if (input.auditLog) {
    await recordAuditEvent(input.auditLog, {
      context: input.context,
      action: "agent.version.activated",
      resourceType: "agent_version",
      resourceId: activated.agentVersionId,
      result: "success",
      metadata: { agentId: activated.agentId, versionNumber: activated.versionNumber },
    });
  }

  if (input.eventBus) {
    await input.eventBus.publish(
      createEventEnvelope(input.context, {
        type: "agent-platform.agent-version.activated",
        payload: sanitizeMetadata({
          agentId: activated.agentId,
          agentVersionId: activated.agentVersionId,
        }),
        occurredAt: input.context.occurredAt,
      }),
    );
  }

  return ok(activated);
}
