import { sanitizeMetadata, type SafeMetadata } from "../../../../packages/shared/src/core";

export interface JobError {
  readonly code: string;
  readonly message: string;
  readonly retryable: boolean;
  readonly metadata: SafeMetadata;
}

export function createJobError(input: {
  readonly code: string;
  readonly message: string;
  readonly retryable?: boolean;
  readonly metadata?: Readonly<Record<string, unknown>>;
}): JobError {
  return {
    code: input.code,
    message: input.message,
    retryable: input.retryable ?? false,
    metadata: sanitizeMetadata(input.metadata),
  };
}
