import type { CallId } from "../../../../modules/voice/voice-core/src/call-id";
import type { CallSession } from "../../../../modules/voice/voice-core/src/call-session";
import type { CallSessionRepositoryPort } from "../../../../modules/voice/voice-core/src/call-session-repository.port";
import type { ConversationTurn } from "../../../../modules/voice/voice-core/src/conversation-turn";

export class InMemoryCallSessionRepository implements CallSessionRepositoryPort {
  private readonly sessions = new Map<string, CallSession>();
  private readonly turns: ConversationTurn[] = [];

  async save(session: CallSession): Promise<void> {
    this.sessions.set(key(session.tenantId, session.callId), session);
  }

  async findById(tenantId: string, callId: CallId): Promise<CallSession | null> {
    return this.sessions.get(key(tenantId, callId)) ?? null;
  }

  async appendTurn(turn: ConversationTurn): Promise<void> {
    this.turns.push(turn);
  }

  async findTurns(tenantId: string, callId: CallId): Promise<readonly ConversationTurn[]> {
    return this.turns.filter((turn) => turn.tenantId === tenantId && turn.callId === callId);
  }
}

function key(tenantId: string, id: string): string {
  return `${tenantId}:${id}`;
}
