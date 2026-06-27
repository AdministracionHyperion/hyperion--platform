import type { CallId } from "./call-id";
import type { CallSession } from "./call-session";
import type { ConversationTurn } from "./conversation-turn";

export interface CallSessionRepositoryPort {
  save(session: CallSession): Promise<void>;
  findById(tenantId: string, callId: CallId): Promise<CallSession | null>;
  appendTurn(turn: ConversationTurn): Promise<void>;
  findTurns(tenantId: string, callId: CallId): Promise<readonly ConversationTurn[]>;
}
