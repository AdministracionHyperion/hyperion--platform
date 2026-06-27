import {
  createCorrelationId,
  ok,
  type OperationContext,
  type Result,
} from "../../../../../packages/shared/src/core";
import type { EvalRun, EvalRunId } from "../eval-run";
import type { EvalRunRepositoryPort } from "../eval-run-repository.port";

export interface StartEvalRunInput {
  readonly context: OperationContext;
  readonly repository: EvalRunRepositoryPort;
  readonly agentVersionId?: string;
}

export async function startEvalRun(input: StartEvalRunInput): Promise<Result<EvalRun, never>> {
  const run: EvalRun = {
    evalRunId: createEvalRunId(),
    tenantId: input.context.tenantId,
    agentVersionId: input.agentVersionId,
    status: "running",
    startedBy: input.context.actorId,
    startedAt: input.context.occurredAt,
  };

  await input.repository.saveRun(run);
  return ok(run);
}

function createEvalRunId(): EvalRunId {
  const correlationId = createCorrelationId();
  return (
    correlationId.ok ? `eval-run-${correlationId.value}` : `eval-run-${Date.now()}`
  ) as EvalRunId;
}
