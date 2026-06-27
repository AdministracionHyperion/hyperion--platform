import {
  domainError,
  fail,
  ok,
  type DomainError,
  type Result,
} from "../../../../packages/shared/src/core";
import type { FlowNode } from "./flow-node";
import type { FlowTransition } from "./flow-transition";

export function validateFlowPolicy(
  nodes: readonly FlowNode[],
  transitions: readonly FlowTransition[],
): Result<true, DomainError> {
  const startNodes = nodes.filter((node) => node.type === "start");
  if (startNodes.length !== 1) {
    return fail(domainError("invalid_state", "flow must have exactly one start node"));
  }

  if (!nodes.some((node) => node.type === "end")) {
    return fail(domainError("invalid_state", "flow must have at least one end node"));
  }

  const nodeIds = new Set(nodes.map((node) => node.nodeId));
  for (const transition of transitions) {
    if (!nodeIds.has(transition.fromNodeId) || !nodeIds.has(transition.toNodeId)) {
      return fail(domainError("invalid_state", "flow transition references unknown node"));
    }
  }

  for (const node of nodes) {
    if (node.type === "tool" && !node.requiredCapability) {
      return fail(domainError("invalid_state", "tool node requires explicit capability"));
    }

    if (node.type === "handoff" && node.handoffMarked !== true) {
      return fail(domainError("invalid_state", "handoff node must be marked"));
    }
  }

  const adjacency = new Map<string, string[]>();
  for (const node of nodes) {
    adjacency.set(node.nodeId, []);
  }
  for (const transition of transitions) {
    adjacency.get(transition.fromNodeId)?.push(transition.toNodeId);
  }

  const endNodeIds = new Set(
    nodes.filter((node) => node.type === "end").map((node) => node.nodeId),
  );
  for (const node of nodes) {
    if (node.type !== "end" && !canReachEnd(node.nodeId, adjacency, endNodeIds, new Set())) {
      return fail(domainError("invalid_state", "flow contains node path without exit"));
    }
  }

  return ok(true);
}

function canReachEnd(
  nodeId: string,
  adjacency: ReadonlyMap<string, readonly string[]>,
  endNodeIds: ReadonlySet<string>,
  visited: Set<string>,
): boolean {
  if (endNodeIds.has(nodeId)) {
    return true;
  }

  if (visited.has(nodeId)) {
    return false;
  }

  visited.add(nodeId);
  return (adjacency.get(nodeId) ?? []).some((nextNodeId) =>
    canReachEnd(nextNodeId, adjacency, endNodeIds, new Set(visited)),
  );
}
