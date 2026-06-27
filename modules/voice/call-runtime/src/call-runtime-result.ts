import type { CallRuntimeEvent } from "./call-runtime-event";
import type { CallRuntimeSession } from "./call-runtime-session";
import type { MockPostCallResult } from "./mock-post-call-result";

export interface CallRuntimeStartResult {
  readonly session: CallRuntimeSession;
  readonly events: readonly CallRuntimeEvent[];
}

export interface CallRuntimeFinalizeResult {
  readonly session: CallRuntimeSession;
  readonly postCallResult: MockPostCallResult;
}
