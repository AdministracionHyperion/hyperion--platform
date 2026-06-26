import { type SafeMetadata } from "../../../../packages/shared/src/core";
import type { CallDirection } from "./call-direction";
import type { CallId } from "./call-id";
import type { CallParticipant } from "./call-participant";
import type { CallStatus } from "./call-status";

export interface CallSession {
  readonly callId: CallId;
  readonly tenantId: string;
  readonly direction: CallDirection;
  readonly status: CallStatus;
  readonly participants: readonly CallParticipant[];
  readonly agentRuntimeRef?: string;
  readonly knowledgeRuntimeRef?: string;
  readonly startedAt?: Date;
  readonly endedAt?: Date;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly correlationId: string;
  readonly metadata: SafeMetadata;
  readonly turns: readonly import("./conversation-turn").ConversationTurn[];
}
