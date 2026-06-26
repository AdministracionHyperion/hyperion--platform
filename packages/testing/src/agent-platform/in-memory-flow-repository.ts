import type { FlowDefinition } from "../../../../modules/agent-platform/flow-management/src/flow-definition";
import type { FlowId } from "../../../../modules/agent-platform/flow-management/src/flow-id";
import type { FlowRepositoryPort } from "../../../../modules/agent-platform/flow-management/src/flow-repository.port";

export class InMemoryFlowRepository implements FlowRepositoryPort {
  private readonly flows = new Map<string, FlowDefinition>();

  async save(flow: FlowDefinition): Promise<void> {
    this.flows.set(key(flow.tenantId, flow.flowId), flow);
  }

  async findById(tenantId: string, flowId: FlowId): Promise<FlowDefinition | null> {
    return this.flows.get(key(tenantId, flowId)) ?? null;
  }
}

function key(tenantId: string, id: string): string {
  return `${tenantId}:${id}`;
}
