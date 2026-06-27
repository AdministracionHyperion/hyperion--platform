import {
  validateSafeIdentifier,
  type DomainError,
  type Result,
} from "../../../../packages/shared/src/core";

export type JobId = string & { readonly __brand: "JobId" };

export function createJobId(value: string): Result<JobId, DomainError> {
  const valid = validateSafeIdentifier(value, "jobId");
  return valid.ok ? { ok: true, value: valid.value as JobId } : valid;
}
