import type { FlowDefinition } from "./flow-definition";
import type { FlowId } from "./flow-id";

export interface FlowRepositoryPort {
  save(flow: FlowDefinition): Promise<void>;
  findById(tenantId: string, flowId: FlowId): Promise<FlowDefinition | null>;
}
