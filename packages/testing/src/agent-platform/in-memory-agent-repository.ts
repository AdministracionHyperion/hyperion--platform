import type { AgentDeployment } from "../../../../modules/agent-platform/agent-builder/src/agent-deployment";
import type { Agent } from "../../../../modules/agent-platform/agent-builder/src/agent";
import type { AgentId } from "../../../../modules/agent-platform/agent-builder/src/agent-id";
import type { AgentRepositoryPort } from "../../../../modules/agent-platform/agent-builder/src/agent-repository.port";

export class InMemoryAgentRepository implements AgentRepositoryPort {
  private readonly agents = new Map<string, Agent>();
  private readonly deployments: AgentDeployment[] = [];

  async save(agent: Agent): Promise<void> {
    this.agents.set(key(agent.tenantId, agent.agentId), agent);
  }

  async findById(tenantId: string, agentId: AgentId): Promise<Agent | null> {
    return this.agents.get(key(tenantId, agentId)) ?? null;
  }

  async saveDeployment(deployment: AgentDeployment): Promise<void> {
    this.deployments.push(deployment);
  }

  async findDeployments(tenantId: string, agentId: AgentId): Promise<readonly AgentDeployment[]> {
    return this.deployments.filter(
      (deployment) => deployment.tenantId === tenantId && deployment.agentId === agentId,
    );
  }
}

function key(tenantId: string, id: string): string {
  return `${tenantId}:${id}`;
}
