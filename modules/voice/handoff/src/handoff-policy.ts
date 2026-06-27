import {
  domainError,
  fail,
  ok,
  type DomainError,
  type Result,
} from "../../../../packages/shared/src/core";
import { containsRawTranscriptRisk } from "./handoff-summary";

export function validateHandoffSummary(summary: string): Result<true, DomainError> {
  if (summary.trim().length === 0) {
    return fail(domainError("invalid_state", "redacted handoff summary is required"));
  }

  if (containsRawTranscriptRisk(summary)) {
    return fail(
      domainError(
        "invalid_metadata",
        "handoff summary must not include raw transcript or audio references",
      ),
    );
  }

  return ok(true);
}
