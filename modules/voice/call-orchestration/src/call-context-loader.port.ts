import type { OperationContext } from "../../../../packages/shared/src/core";
import type { CallId } from "../../voice-core/src/call-id";
import type { CallContext } from "./call-context";

export interface CallContextLoaderPort {
  loadContext(callId: CallId, operationContext: OperationContext): Promise<CallContext>;
}
