import { type SafeMetadata } from "../../../../packages/shared/src/core";
import type { CallId } from "../../voice-core/src/call-id";
import type { CallObjective } from "./call-objective";
import type { CallRuntimeRef } from "./call-runtime-ref";

export interface CallContext {
  readonly callId: CallId;
  readonly tenantId: string;
  readonly agentRuntimeRef: CallRuntimeRef;
  readonly knowledgeRuntimeRef?: string;
  readonly objective: CallObjective;
  readonly safeFacts: Readonly<Record<string, string>>;
  readonly metadata: SafeMetadata;
}
