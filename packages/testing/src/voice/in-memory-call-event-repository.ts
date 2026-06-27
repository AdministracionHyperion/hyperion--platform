import type { CallEvent } from "../../../../modules/voice/voice-core/src/call-event";
import type { CallEventRepositoryPort } from "../../../../modules/voice/voice-core/src/call-event-repository.port";
import type { CallId } from "../../../../modules/voice/voice-core/src/call-id";

export class InMemoryCallEventRepository implements CallEventRepositoryPort {
  private readonly events: CallEvent[] = [];

  async append(event: CallEvent): Promise<void> {
    this.events.push(event);
  }

  async findByCall(tenantId: string, callId: CallId): Promise<readonly CallEvent[]> {
    return this.events.filter((event) => event.tenantId === tenantId && event.callId === callId);
  }
}
