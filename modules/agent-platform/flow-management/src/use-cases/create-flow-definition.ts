import {
  domainError,
  fail,
  ok,
  type DomainError,
  type OperationContext,
  type Result,
} from "../../../../../packages/shared/src/core";
import { createFlowId } from "../flow-id";
import type { FlowDefinition } from "../flow-definition";
import type { FlowRepositoryPort } from "../flow-repository.port";

export interface CreateFlowDefinitionInput {
  readonly context: OperationContext;
  readonly repository: FlowRepositoryPort;
  readonly flowId: string;
  readonly name: string;
  readonly description: string;
}

export async function createFlowDefinition(
  input: CreateFlowDefinitionInput,
): Promise<Result<FlowDefinition, DomainError>> {
  const flowId = createFlowId(input.flowId);
  if (!flowId.ok) {
    return fail(flowId.error);
  }

  if (input.name.trim().length === 0) {
    return fail(domainError("invalid_state", "flow name must not be empty"));
  }

  const flow: FlowDefinition = {
    flowId: flowId.value,
    tenantId: input.context.tenantId,
    name: input.name,
    description: input.description,
    createdBy: input.context.actorId,
    createdAt: input.context.occurredAt,
    updatedAt: input.context.occurredAt,
  };

  await input.repository.save(flow);
  return ok(flow);
}
