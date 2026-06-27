import type { SafeMetadata } from "../../../../packages/shared/src/core";

export const callRuntimeEventTypes = [
  "call.mock.started",
  "call.mock.agent_prompted",
  "call.mock.user_intent_detected",
  "call.mock.completed",
] as const;

export type CallRuntimeEventType = (typeof callRuntimeEventTypes)[number];

export interface CallRuntimeEvent {
  readonly eventId: string;
  readonly sessionId: string;
  readonly tenantId: string;
  readonly correlationId: string;
  readonly type: CallRuntimeEventType;
  readonly occurredAt: Date;
  readonly payload: SafeMetadata;
  readonly providerEventRef: string;
}
