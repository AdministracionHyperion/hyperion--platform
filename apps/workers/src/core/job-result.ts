import { sanitizeMetadata, type SafeMetadata } from "../../../../packages/shared/src/core";
import type { JobError } from "./job-error";
import type { JobId } from "./job-id";
import type { JobStatus } from "./job-status";

export interface JobResult {
  readonly success: boolean;
  readonly jobId: JobId;
  readonly status: JobStatus;
  readonly output?: SafeMetadata;
  readonly error?: JobError;
  readonly metadata: SafeMetadata;
}

export function createJobSuccess(input: {
  readonly jobId: JobId;
  readonly status?: JobStatus;
  readonly output?: Readonly<Record<string, unknown>>;
  readonly metadata?: Readonly<Record<string, unknown>>;
}): JobResult {
  return {
    success: true,
    jobId: input.jobId,
    status: input.status ?? "succeeded",
    output: sanitizeMetadata(input.output),
    metadata: sanitizeMetadata(input.metadata),
  };
}

export function createJobFailure(input: {
  readonly jobId: JobId;
  readonly status?: JobStatus;
  readonly error: JobError;
  readonly metadata?: Readonly<Record<string, unknown>>;
}): JobResult {
  return {
    success: false,
    jobId: input.jobId,
    status: input.status ?? "failed",
    error: input.error,
    metadata: sanitizeMetadata(input.metadata),
  };
}
