import type { SafeMetadata } from "../../../../packages/shared/src/core";

export interface CallRuntimeError {
  readonly code: string;
  readonly message: string;
  readonly metadata: SafeMetadata;
}
