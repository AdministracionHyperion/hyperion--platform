import type { Result } from "../../../../../packages/shared/src/core";
import type { CallRuntimeCommand } from "../call-runtime-command";
import type { CallRuntimeError } from "../call-runtime-error";
import type { CallRuntimePort } from "../call-runtime-port";
import type { CallRuntimeStartResult } from "../call-runtime-result";

export function startMockCallRuntime(input: {
  readonly runtime: CallRuntimePort;
  readonly command: CallRuntimeCommand;
}): Promise<Result<CallRuntimeStartResult, CallRuntimeError>> {
  return input.runtime.startSession(input.command);
}
