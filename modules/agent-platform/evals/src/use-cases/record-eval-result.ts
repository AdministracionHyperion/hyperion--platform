import {
  createCorrelationId,
  domainError,
  fail,
  ok,
  sanitizeMetadata,
  type DomainError,
  type OperationContext,
  type Result,
} from "../../../../../packages/shared/src/core";
import type { FeedbackRepositoryPort } from "../../../../core/feedback/src/feedback-repository.port";
import { recordFeedbackEvent } from "../../../../core/feedback/src/use-cases/record-feedback-event";
import type { EvalFinding, EvalResult, EvalResultId } from "../eval-result";
import type { EvalRunId } from "../eval-run";
import type { EvalRunRepositoryPort } from "../eval-run-repository.port";
import type { EvalScenarioId } from "../eval-scenario-id";
import type { EvalResultStatus } from "../eval-status";

export interface RecordEvalResultInput {
  readonly context: OperationContext;
  readonly repository: EvalRunRepositoryPort;
  readonly evalRunId: EvalRunId;
  readonly evalScenarioId: EvalScenarioId;
  readonly status: EvalResultStatus;
  readonly score: number;
  readonly findings: readonly EvalFinding[];
  readonly metadata?: Readonly<Record<string, unknown>>;
  readonly feedbackRepository?: FeedbackRepositoryPort;
}

export async function recordEvalResult(
  input: RecordEvalResultInput,
): Promise<Result<EvalResult, DomainError>> {
  const run = await input.repository.findRun(input.context.tenantId, input.evalRunId);
  if (!run) {
    return fail(domainError("not_found", "eval run not found"));
  }

  const result: EvalResult = {
    evalResultId: createEvalResultId(),
    tenantId: input.context.tenantId,
    evalRunId: input.evalRunId,
    evalScenarioId: input.evalScenarioId,
    status: input.status,
    score: input.score,
    findings: input.findings,
    metadata: sanitizeMetadata(input.metadata),
    occurredAt: input.context.occurredAt,
  };

  await input.repository.saveResult(result);

  if (
    input.feedbackRepository &&
    input.findings.some((finding) => finding.policyViolation === true)
  ) {
    await recordFeedbackEvent({
      context: input.context,
      repository: input.feedbackRepository,
      source: "eval",
      resourceType: "eval_result",
      resourceId: result.evalResultId,
      outcome: "policy_violation",
      score: input.score,
      metadata: { evalRunId: input.evalRunId, evalScenarioId: input.evalScenarioId },
    });
  }

  return ok(result);
}

function createEvalResultId(): EvalResultId {
  const correlationId = createCorrelationId();
  return (
    correlationId.ok ? `eval-result-${correlationId.value}` : `eval-result-${Date.now()}`
  ) as EvalResultId;
}
