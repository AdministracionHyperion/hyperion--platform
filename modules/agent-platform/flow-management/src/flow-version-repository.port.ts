import type { FlowId } from "./flow-id";
import type { FlowVersion, FlowVersionId } from "./flow-version";

export interface FlowVersionRepositoryPort {
  save(version: FlowVersion): Promise<void>;
  findById(tenantId: string, flowVersionId: FlowVersionId): Promise<FlowVersion | null>;
  findByFlow(tenantId: string, flowId: FlowId): Promise<readonly FlowVersion[]>;
}
