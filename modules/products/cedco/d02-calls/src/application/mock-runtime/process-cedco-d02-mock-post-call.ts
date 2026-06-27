import {
  domainError,
  fail,
  ok,
  sanitizeMetadata,
  type DomainError,
  type Result,
} from "../../../../../../../packages/shared/src/core";
import {
  findForbiddenRuntimeKey,
  type MockPostCallResult,
} from "../../../../../../voice/call-runtime/src";

export interface CedcoD02MockPostCallProcessing {
  readonly safeSummary: string;
  readonly disposition: string;
  readonly auditNotes: readonly string[];
  readonly metrics: ReturnType<typeof sanitizeMetadata>;
  readonly handoffRecommended: boolean;
}

export function processCedcoD02MockPostCall(
  result: MockPostCallResult,
): Result<CedcoD02MockPostCallProcessing, DomainError> {
  const forbidden = findForbiddenRuntimeKey(result);
  if (forbidden) {
    return fail({
      ...domainError(
        "invalid_metadata",
        `mock post-call result contains forbidden field ${forbidden}`,
      ),
    });
  }

  return ok({
    safeSummary: result.safeSummary,
    disposition: result.disposition,
    auditNotes: [...result.auditNotes, "non_clinical_mock_summary"],
    metrics: sanitizeMetadata(result.metrics),
    handoffRecommended: result.handoffRecommended,
  });
}
