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
import { authorizeActorAction } from "../../../../core/identity-access/src/use-cases/authorize-actor-action";
import type { Agent } from "../agent";
import { createAgentId } from "../agent-id";
import type { AgentRepositoryPort } from "../agent-repository.port";

export interface CreateAgentInput {
  readonly context: OperationContext;
  readonly actor: ActorContext;
  readonly repository: AgentRepositoryPort;
  readonly agentId: string;
  readonly name: string;
  readonly description: string;
  readonly defaultLocale: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
  readonly auditLog?: AuditLogPort;
  readonly eventBus?: EventBusPort;
}

export async function createAgent(input: CreateAgentInput): Promise<Result<Agent, DomainError>> {
  const authorization = authorizeActorAction({
    actor: input.actor,
    context: input.context,
    permission: "agent:write",
  });
  if (!authorization.ok) {
    return fail(authorization.error);
  }

  const agentId = createAgentId(input.agentId);
  if (!agentId.ok) {
    return fail(agentId.error);
  }

  if (input.name.trim().length === 0) {
    return fail(domainError("invalid_state", "agent name must not be empty"));
  }

  const existing = await input.repository.findById(input.context.tenantId, agentId.value);
  if (existing) {
    return fail(domainError("conflict", "agent already exists"));
  }

  const agent: Agent = {
    agentId: agentId.value,
    tenantId: input.context.tenantId,
    name: input.name,
    description: input.description,
    status: "draft",
    defaultLocale: input.defaultLocale,
    createdBy: input.context.actorId,
    createdAt: input.context.occurredAt,
    updatedAt: input.context.occurredAt,
    metadata: sanitizeMetadata(input.metadata),
  };

  await input.repository.save(agent);

  if (input.auditLog) {
    await recordAuditEvent(input.auditLog, {
      context: input.context,
      action: "agent.created",
      resourceType: "agent",
      resourceId: agent.agentId,
      result: "success",
      metadata: { agentId: agent.agentId, name: agent.name },
    });
  }

  if (input.eventBus) {
    await input.eventBus.publish(
      createEventEnvelope(input.context, {
        type: "agent-platform.agent.created",
        payload: sanitizeMetadata({ agentId: agent.agentId }),
        occurredAt: input.context.occurredAt,
      }),
    );
  }

  return ok(agent);
}
