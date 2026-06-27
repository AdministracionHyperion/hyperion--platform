import type { AgentCapability } from "../../agent-builder/src/agent-capability";

export type FlowNodeType = "start" | "message" | "intent" | "tool" | "decision" | "handoff" | "end";

export interface FlowNode {
  readonly nodeId: string;
  readonly type: FlowNodeType;
  readonly label: string;
  readonly requiredCapability?: AgentCapability;
  readonly handoffMarked?: boolean;
}
