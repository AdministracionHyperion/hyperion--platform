import type { Result } from "../../../../../packages/shared/src/core";
import type { CallRuntimeError } from "../call-runtime-error";
import type { CallRuntimePort } from "../call-runtime-port";
import type { CallRuntimeFinalizeResult } from "../call-runtime-result";

export function finalizeMockCallSession(input: {
  readonly runtime: CallRuntimePort;
  readonly sessionId: string;
}): Promise<Result<CallRuntimeFinalizeResult, CallRuntimeError>> {
  return input.runtime.finalizeSession(input.sessionId);
}
