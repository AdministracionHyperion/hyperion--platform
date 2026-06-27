import type { SafeMetadata } from "../../../../packages/shared/src/core";
import type { CallRuntimeStatus } from "./call-runtime-status";

export interface CallRuntimeSession {
  readonly sessionId: string;
  readonly tenantId: string;
  readonly correlationId: string;
  readonly runtimeMode: "mock";
  readonly status: CallRuntimeStatus;
  readonly providerCallRef: string;
  readonly startedAt: Date;
  readonly completedAt?: Date;
  readonly blockedReasons: readonly string[];
  readonly metadata: SafeMetadata;
}
