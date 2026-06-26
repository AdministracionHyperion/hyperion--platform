import {
  createCorrelationId,
  domainError,
  fail,
  ok,
  type DomainError,
  type OperationContext,
  type Result,
} from "../../../../../packages/shared/src/core";
import type { ActorContext } from "../../../../core/identity-access/src/actor-context";
import { authorizeActorAction } from "../../../../core/identity-access/src/use-cases/authorize-actor-action";
import { hasWildcardCapability, type AgentCapability } from "../agent-capability";
import { createAgentId } from "../agent-id";
import type { AgentRepositoryPort } from "../agent-repository.port";
import type { AgentVersion, AgentVersionId } from "../agent-version";
import type { AgentVersionRepositoryPort } from "../agent-version-repository.port";

export interface CreateAgentVersionInput {
  readonly context: OperationContext;
  readonly actor: ActorContext;
  readonly agentRepository: AgentRepositoryPort;
  readonly versionRepository: AgentVersionRepositoryPort;
  readonly agentId: string;
  readonly promptVersionId?: string;
  readonly flowVersionId?: string;
  readonly knowledgeBaseVersionId?: string;
  readonly capabilities: readonly AgentCapability[];
}

export async function createAgentVersion(
  input: CreateAgentVersionInput,
): Promise<Result<AgentVersion, DomainError>> {
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

  const agent = await input.agentRepository.findById(input.context.tenantId, agentId.value);
  if (!agent) {
    return fail(domainError("not_found", "agent not found"));
  }

  if (input.capabilities.length === 0 || hasWildcardCapability(input.capabilities)) {
    return fail(domainError("invalid_state", "agent capabilities must be explicit"));
  }

  const versions = await input.versionRepository.findByAgent(input.context.tenantId, agentId.value);
  const versionNumber = Math.max(0, ...versions.map((version) => version.versionNumber)) + 1;

  const version: AgentVersion = {
    agentVersionId: createAgentVersionId(),
    tenantId: input.context.tenantId,
    agentId: agentId.value,
    versionNumber,
    status: "draft",
    promptVersionId: input.promptVersionId,
    flowVersionId: input.flowVersionId,
    knowledgeBaseVersionId: input.knowledgeBaseVersionId,
    capabilities: input.capabilities,
    createdBy: input.context.actorId,
    createdAt: input.context.occurredAt,
  };

  await input.versionRepository.save(version);
  return ok(version);
}

function createAgentVersionId(): AgentVersionId {
  const correlationId = createCorrelationId();
  return (
    correlationId.ok ? `agent-version-${correlationId.value}` : `agent-version-${Date.now()}`
  ) as AgentVersionId;
}
