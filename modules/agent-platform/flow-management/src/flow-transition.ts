export interface FlowTransition {
  readonly fromNodeId: string;
  readonly toNodeId: string;
  readonly condition?: string;
}
