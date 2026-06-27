import { type Brand, type SafeMetadata } from "../../../../packages/shared/src/core";
import type { CallId } from "./call-id";
import type { CallEventType } from "./call-event-type";
import type { CallStatus } from "./call-status";

export type CallEventId = Brand<string, "CallEventId">;

export interface CallEvent {
  readonly callEventId: CallEventId;
  readonly callId: CallId;
  readonly tenantId: string;
  readonly actorId?: string;
  readonly correlationId: string;
  readonly type: CallEventType;
  readonly status?: CallStatus;
  readonly metadata: SafeMetadata;
  readonly occurredAt: Date;
}
