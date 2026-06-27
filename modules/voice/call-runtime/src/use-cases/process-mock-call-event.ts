import type { Result } from "../../../../../packages/shared/src/core";
import type { CallRuntimeError } from "../call-runtime-error";
import type { CallRuntimeEvent } from "../call-runtime-event";
import type { CallRuntimePort } from "../call-runtime-port";
import type { CallRuntimeSession } from "../call-runtime-session";

export function processMockCallEvent(input: {
  readonly runtime: CallRuntimePort;
  readonly event: CallRuntimeEvent;
}): Promise<Result<CallRuntimeSession, CallRuntimeError>> {
  return input.runtime.processEvent(input.event);
}
