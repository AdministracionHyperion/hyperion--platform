import type { FlowId } from "./flow-id";

export interface FlowDefinition {
  readonly flowId: FlowId;
  readonly tenantId: string;
  readonly name: string;
  readonly description: string;
  readonly createdBy: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
