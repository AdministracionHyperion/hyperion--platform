import type { FlowId } from "../../../../modules/agent-platform/flow-management/src/flow-id";
import type {
  FlowVersion,
  FlowVersionId,
} from "../../../../modules/agent-platform/flow-management/src/flow-version";
import type { FlowVersionRepositoryPort } from "../../../../modules/agent-platform/flow-management/src/flow-version-repository.port";

export class InMemoryFlowVersionRepository implements FlowVersionRepositoryPort {
  private readonly versions = new Map<string, FlowVersion>();

  async save(version: FlowVersion): Promise<void> {
    this.versions.set(key(version.tenantId, version.flowVersionId), version);
  }

  async findById(tenantId: string, flowVersionId: FlowVersionId): Promise<FlowVersion | null> {
    return this.versions.get(key(tenantId, flowVersionId)) ?? null;
  }

  async findByFlow(tenantId: string, flowId: FlowId): Promise<readonly FlowVersion[]> {
    return [...this.versions.values()].filter(
      (version) => version.tenantId === tenantId && version.flowId === flowId,
    );
  }
}

function key(tenantId: string, id: string): string {
  return `${tenantId}:${id}`;
}
