import type { HandoffId } from "../../../../modules/voice/handoff/src/handoff-id";
import type { HandoffRepositoryPort } from "../../../../modules/voice/handoff/src/handoff-repository.port";
import type { HandoffRequest } from "../../../../modules/voice/handoff/src/handoff-request";

export class InMemoryHandoffRepository implements HandoffRepositoryPort {
  private readonly requests = new Map<string, HandoffRequest>();

  async save(request: HandoffRequest): Promise<void> {
    this.requests.set(key(request.tenantId, request.handoffId), request);
  }

  async findById(tenantId: string, handoffId: HandoffId): Promise<HandoffRequest | null> {
    return this.requests.get(key(tenantId, handoffId)) ?? null;
  }

  async findByCall(tenantId: string, callId: string): Promise<readonly HandoffRequest[]> {
    return [...this.requests.values()].filter(
      (request) => request.tenantId === tenantId && request.callId === callId,
    );
  }
}

function key(tenantId: string, id: string): string {
  return `${tenantId}:${id}`;
}
