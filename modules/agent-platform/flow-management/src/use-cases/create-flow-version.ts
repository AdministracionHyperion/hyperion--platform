import {
  createCorrelationId,
  fail,
  ok,
  type DomainError,
  type OperationContext,
  type Result,
} from "../../../../../packages/shared/src/core";
import { createFlowId } from "../flow-id";
import type { FlowNode } from "../flow-node";
import type { FlowRepositoryPort } from "../flow-repository.port";
import type { FlowTransition } from "../flow-transition";
import type { FlowVersion, FlowVersionId } from "../flow-version";
import type { FlowVersionRepositoryPort } from "../flow-version-repository.port";
import { validateFlowGraph } from "./validate-flow-graph";

export interface CreateFlowVersionInput {
  readonly context: OperationContext;
  readonly flowRepository: FlowRepositoryPort;
  readonly versionRepository: FlowVersionRepositoryPort;
  readonly flowId: string;
  readonly nodes: readonly FlowNode[];
  readonly transitions: readonly FlowTransition[];
}

export async function createFlowVersion(
  input: CreateFlowVersionInput,
): Promise<Result<FlowVersion, DomainError>> {
  const flowId = createFlowId(input.flowId);
  if (!flowId.ok) {
    return fail(flowId.error);
  }

  const flow = await input.flowRepository.findById(input.context.tenantId, flowId.value);
  if (!flow) {
    return fail({ code: "not_found", message: "flow definition not found" });
  }

  const validation = validateFlowGraph(input.nodes, input.transitions);
  if (!validation.ok) {
    return fail(validation.error);
  }

  const versions = await input.versionRepository.findByFlow(input.context.tenantId, flowId.value);
  const versionNumber = Math.max(0, ...versions.map((version) => version.versionNumber)) + 1;
  const version: FlowVersion = {
    flowVersionId: createFlowVersionId(),
    tenantId: input.context.tenantId,
    flowId: flowId.value,
    versionNumber,
    status: "draft",
    nodes: input.nodes,
    transitions: input.transitions,
    createdBy: input.context.actorId,
    createdAt: input.context.occurredAt,
  };

  await input.versionRepository.save(version);
  return ok(version);
}

function createFlowVersionId(): FlowVersionId {
  const correlationId = createCorrelationId();
  return (
    correlationId.ok ? `flow-version-${correlationId.value}` : `flow-version-${Date.now()}`
  ) as FlowVersionId;
}
