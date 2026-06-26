import { type SafeMetadata } from "../../../../packages/shared/src/core";
import type { CallId } from "../../voice-core/src/call-id";
import type { HandoffId } from "./handoff-id";
import type { HandoffPriority } from "./handoff-priority";
import type { HandoffStatus } from "./handoff-status";

export interface HandoffRequest {
  readonly handoffId: HandoffId;
  readonly tenantId: string;
  readonly callId: CallId;
  readonly status: HandoffStatus;
  readonly priority: HandoffPriority;
  readonly reason: string;
  readonly targetQueue: string;
  readonly redactedSummary: string;
  readonly createdAt: Date;
  readonly assignedAt?: Date;
  readonly resolvedAt?: Date;
  readonly assignedToActorId?: string;
  readonly metadata: SafeMetadata;
}
