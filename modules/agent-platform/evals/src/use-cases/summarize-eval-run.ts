import {
  domainError,
  fail,
  ok,
  type DomainError,
  type Result,
} from "../../../../../packages/shared/src/core";
import type { EvalRunId } from "../eval-run";
import type { EvalRunRepositoryPort } from "../eval-run-repository.port";
import type { EvalResultStatus } from "../eval-status";

export interface EvalRunSummary {
  readonly evalRunId: EvalRunId;
  readonly status: EvalResultStatus;
  readonly total: number;
  readonly passed: number;
  readonly failed: number;
  readonly needsReview: number;
  readonly averageScore: number;
}

export interface SummarizeEvalRunInput {
  readonly tenantId: string;
  readonly repository: EvalRunRepositoryPort;
  readonly evalRunId: EvalRunId;
}

export async function summarizeEvalRun(
  input: SummarizeEvalRunInput,
): Promise<Result<EvalRunSummary, DomainError>> {
  const run = await input.repository.findRun(input.tenantId, input.evalRunId);
  if (!run) {
    return fail(domainError("not_found", "eval run not found"));
  }

  const results = await input.repository.findResultsByRun(input.tenantId, input.evalRunId);
  const failed = results.filter((result) => result.status === "failed").length;
  const needsReview = results.filter((result) => result.status === "needs_review").length;
  const passed = results.filter((result) => result.status === "passed").length;
  const status: EvalResultStatus =
    failed > 0 ? "failed" : needsReview > 0 ? "needs_review" : "passed";
  const totalScore = results.reduce((sum, result) => sum + result.score, 0);

  return ok({
    evalRunId: input.evalRunId,
    status,
    total: results.length,
    passed,
    failed,
    needsReview,
    averageScore: results.length > 0 ? totalScore / results.length : 0,
  });
}
