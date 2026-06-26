import {
  domainError,
  fail,
  ok,
  type DomainError,
  type OperationContext,
  type Result,
} from "../../../../../packages/shared/src/core";
import type { FlowVersion, FlowVersionId } from "../flow-version";
import type { FlowVersionRepositoryPort } from "../flow-version-repository.port";

export interface ActivateFlowVersionInput {
  readonly context: OperationContext;
  readonly repository: FlowVersionRepositoryPort;
  readonly flowVersionId: FlowVersionId;
}

export async function activateFlowVersion(
  input: ActivateFlowVersionInput,
): Promise<Result<FlowVersion, DomainError>> {
  const target = await input.repository.findById(input.context.tenantId, input.flowVersionId);
  if (!target) {
    return fail(domainError("not_found", "flow version not found"));
  }

  const versions = await input.repository.findByFlow(input.context.tenantId, target.flowId);
  for (const version of versions) {
    if (version.status === "active" && version.flowVersionId !== target.flowVersionId) {
      await input.repository.save({ ...version, status: "archived" });
    }
  }

  const activated: FlowVersion = {
    ...target,
    status: "active",
    activatedAt: input.context.occurredAt,
  };
  await input.repository.save(activated);
  return ok(activated);
}
