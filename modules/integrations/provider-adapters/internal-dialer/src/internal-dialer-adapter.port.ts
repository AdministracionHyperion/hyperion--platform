import type { OperationContext } from "../../../../../packages/shared/src/core";
import type { DialerDispatchRequest } from "./dialer-dispatch-request";
import type { DialerDispatchResult } from "./dialer-dispatch-result";

export interface InternalDialerAdapterPort {
  validateRequest(
    request: DialerDispatchRequest,
    context: OperationContext,
  ): Promise<DialerDispatchResult>;
  dryRun(request: DialerDispatchRequest, context: OperationContext): Promise<DialerDispatchResult>;
  dispatch(
    request: DialerDispatchRequest,
    context: OperationContext,
  ): Promise<DialerDispatchResult>;
  getStatus(requestId: string, context: OperationContext): Promise<DialerDispatchResult>;
  normalizeResult(
    result: DialerDispatchResult,
    context: OperationContext,
  ): Promise<DialerDispatchResult>;
}
