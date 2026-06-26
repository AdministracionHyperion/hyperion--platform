import { type SafeMetadata } from "../../../../packages/shared/src/core";
import type { CallRuntimeRef } from "../../call-orchestration/src/call-runtime-ref";
import type { CallId } from "../../voice-core/src/call-id";
import type { CalleeAlias } from "./callee-alias";
import type { CallerAlias } from "./caller-alias";

export interface OutboundCallLaunchRequest {
  readonly tenantId: string;
  readonly callId: CallId;
  readonly calleeAlias: CalleeAlias;
  readonly callerAlias: CallerAlias;
  readonly agentRuntimeRef?: CallRuntimeRef;
  readonly campaignRef?: string;
  readonly purpose: string;
  readonly scheduledWindow?: { readonly startsAt: Date; readonly endsAt: Date };
  readonly metadata: SafeMetadata;
}

export interface RuntimeContactTarget {
  readonly e164Number: string;
  readonly nonPersistable: true;
}
