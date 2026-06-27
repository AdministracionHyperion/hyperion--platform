import type { Result } from "../../../../packages/shared/src/core";
import type { CallRuntimeCommand } from "./call-runtime-command";
import type { CallRuntimeError } from "./call-runtime-error";
import type { CallRuntimeEvent } from "./call-runtime-event";
import type { CallRuntimeFinalizeResult, CallRuntimeStartResult } from "./call-runtime-result";
import type { CallRuntimeSession } from "./call-runtime-session";

export interface CallRuntimePort {
  startSession(
    command: CallRuntimeCommand,
  ): Promise<Result<CallRuntimeStartResult, CallRuntimeError>>;
  processEvent(event: CallRuntimeEvent): Promise<Result<CallRuntimeSession, CallRuntimeError>>;
  finalizeSession(sessionId: string): Promise<Result<CallRuntimeFinalizeResult, CallRuntimeError>>;
}
