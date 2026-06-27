import type { AgentDeployment } from "./agent-deployment";
import type { Agent } from "./agent";
import type { AgentId } from "./agent-id";

export interface AgentRepositoryPort {
  save(agent: Agent): Promise<void>;
  findById(tenantId: string, agentId: AgentId): Promise<Agent | null>;
  saveDeployment(deployment: AgentDeployment): Promise<void>;
  findDeployments(tenantId: string, agentId: AgentId): Promise<readonly AgentDeployment[]>;
}
