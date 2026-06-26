import type { DomainError, Result } from "../../../../../packages/shared/src/core";
import { validateFlowPolicy } from "../flow-policy";
import type { FlowNode } from "../flow-node";
import type { FlowTransition } from "../flow-transition";

export function validateFlowGraph(
  nodes: readonly FlowNode[],
  transitions: readonly FlowTransition[],
): Result<true, DomainError> {
  return validateFlowPolicy(nodes, transitions);
}
