import type { SafeMetadata } from "../../../../../packages/shared/src/core";
import type { DialerApprovalRefs } from "./dialer-approval-refs";
import type { DialerCallbackRef } from "./dialer-callback-ref";
import type { DialerConsent } from "./dialer-consent";
import type { DialerDispatchMode } from "./dialer-dispatch-mode";
import type { DialerRuntimeMode } from "./dialer-runtime-mode";

export interface DialerDispatchRequest {
  readonly externalRequestId: string;
  readonly tenantId: string;
  readonly mode: DialerDispatchMode;
  readonly runtimeMode: DialerRuntimeMode;
  readonly safeContactRef: string;
  readonly phoneE164NonPersistable?: string;
  readonly agentAlias: string;
  readonly callerAlias: string;
  readonly dynamicVars?: SafeMetadata;
  readonly consent: DialerConsent;
  readonly callback: DialerCallbackRef;
  readonly approvals?: DialerApprovalRefs;
  readonly metadata?: SafeMetadata;
}
