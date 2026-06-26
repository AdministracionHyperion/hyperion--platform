import type { Brand } from "../../../../packages/shared/src/core";
import type { FlowId } from "./flow-id";
import type { FlowNode } from "./flow-node";
import type { FlowTransition } from "./flow-transition";

export type FlowVersionId = Brand<string, "FlowVersionId">;
export type FlowVersionStatus = "draft" | "active" | "archived";

export interface FlowVersion {
  readonly flowVersionId: FlowVersionId;
  readonly tenantId: string;
  readonly flowId: FlowId;
  readonly versionNumber: number;
  readonly status: FlowVersionStatus;
  readonly nodes: readonly FlowNode[];
  readonly transitions: readonly FlowTransition[];
  readonly createdBy: string;
  readonly createdAt: Date;
  readonly activatedAt?: Date;
}
