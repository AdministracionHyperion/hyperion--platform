import { type Brand, type SafeMetadata } from "../../../../packages/shared/src/core";
import type { CallId } from "./call-id";
import type { ConversationTurnRole } from "./conversation-turn-role";

export type ConversationTurnId = Brand<string, "ConversationTurnId">;

export interface ConversationTurn {
  readonly turnId: ConversationTurnId;
  readonly callId: CallId;
  readonly tenantId: string;
  readonly role: ConversationTurnRole;
  readonly contentRedacted: string;
  readonly occurredAt: Date;
  readonly metadata: SafeMetadata;
}
