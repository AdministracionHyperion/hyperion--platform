import type { AgentId } from "./agent-id";
import type { AgentVersion, AgentVersionId } from "./agent-version";

export interface AgentVersionRepositoryPort {
  save(version: AgentVersion): Promise<void>;
  findById(tenantId: string, agentVersionId: AgentVersionId): Promise<AgentVersion | null>;
  findByAgent(tenantId: string, agentId: AgentId): Promise<readonly AgentVersion[]>;
}
