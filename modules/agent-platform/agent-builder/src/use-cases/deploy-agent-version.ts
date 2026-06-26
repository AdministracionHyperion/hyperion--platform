import {
  createCorrelationId,
  domainError,
  fail,
  ok,
  type DomainError,
  type OperationContext,
  type Result,
} from "../../../../../packages/shared/src/core";
import type { AuditLogPort } from "../../../../core/audit/src/audit-log.port";
import { recordAuditEvent } from "../../../../core/audit/src/use-cases/record-audit-event";
import type { ActorContext } from "../../../../core/identity-access/src/actor-context";
import { authorizeActorAction } from "../../../../core/identity-access/src/use-cases/authorize-actor-action";
import type { AgentDeployment, AgentDeploymentId } from "../agent-deployment";
import type { AgentEnvironment } from "../agent-environment";
import type { AgentRepositoryPort } from "../agent-repository.port";
import type { AgentVersionId } from "../agent-version";
import type { AgentVersionRepositoryPort } from "../agent-version-repository.port";

export interface DeployAgentVersionInput {
  readonly context: OperationContext;
  readonly actor: ActorContext;
  readonly agentRepository: AgentRepositoryPort;
  readonly versionRepository: AgentVersionRepositoryPort;
  readonly agentVersionId: AgentVersionId;
  readonly environment: AgentEnvironment;
  readonly auditLog?: AuditLogPort;
}

export async function deployAgentVersion(
  input: DeployAgentVersionInput,
): Promise<Result<AgentDeployment, DomainError>> {
  const authorization = authorizeActorAction({
    actor: input.actor,
    context: input.context,
    permission: "agent:write",
  });
  if (!authorization.ok) {
    return fail(authorization.error);
  }

  if (input.environment === "production") {
    if (input.auditLog) {
      await recordAuditEvent(input.auditLog, {
        context: input.context,
        action: "agent.version.deploy.blocked",
        resourceType: "agent_version",
        resourceId: input.agentVersionId,
        result: "failure",
        metadata: { reason: "production_deploy_blocked" },
      });
    }
    return fail(domainError("invalid_state", "production deploy is blocked in this phase"));
  }

  const version = await input.versionRepository.findById(
    input.context.tenantId,
    input.agentVersionId,
  );
  if (!version) {
    return fail(domainError("not_found", "agent version not found"));
  }

  const deployment: AgentDeployment = {
    deploymentId: createAgentDeploymentId(),
    tenantId: input.context.tenantId,
    agentId: version.agentId,
    agentVersionId: version.agentVersionId,
    environment: input.environment,
    status: "active",
    deployedBy: input.context.actorId,
    deployedAt: input.context.occurredAt,
  };

  await input.agentRepository.saveDeployment(deployment);

  if (input.auditLog) {
    await recordAuditEvent(input.auditLog, {
      context: input.context,
      action: "agent.version.deployed",
      resourceType: "agent_deployment",
      resourceId: deployment.deploymentId,
      result: "success",
      metadata: { environment: deployment.environment, agentVersionId: deployment.agentVersionId },
    });
  }

  return ok(deployment);
}

function createAgentDeploymentId(): AgentDeploymentId {
  const correlationId = createCorrelationId();
  return (
    correlationId.ok ? `agent-deployment-${correlationId.value}` : `agent-deployment-${Date.now()}`
  ) as AgentDeploymentId;
}
