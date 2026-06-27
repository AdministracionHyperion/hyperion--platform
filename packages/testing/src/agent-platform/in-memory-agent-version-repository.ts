import type { AgentId } from "../../../../modules/agent-platform/agent-builder/src/agent-id";
import type {
  AgentVersion,
  AgentVersionId,
} from "../../../../modules/agent-platform/agent-builder/src/agent-version";
import type { AgentVersionRepositoryPort } from "../../../../modules/agent-platform/agent-builder/src/agent-version-repository.port";

export class InMemoryAgentVersionRepository implements AgentVersionRepositoryPort {
  private readonly versions = new Map<string, AgentVersion>();

  async save(version: AgentVersion): Promise<void> {
    this.versions.set(key(version.tenantId, version.agentVersionId), version);
  }

  async findById(tenantId: string, agentVersionId: AgentVersionId): Promise<AgentVersion | null> {
    return this.versions.get(key(tenantId, agentVersionId)) ?? null;
  }

  async findByAgent(tenantId: string, agentId: AgentId): Promise<readonly AgentVersion[]> {
    return [...this.versions.values()].filter(
      (version) => version.tenantId === tenantId && version.agentId === agentId,
    );
  }
}

function key(tenantId: string, id: string): string {
  return `${tenantId}:${id}`;
}
