import type { HandoffId } from "./handoff-id";
import type { HandoffRequest } from "./handoff-request";

export interface HandoffRepositoryPort {
  save(request: HandoffRequest): Promise<void>;
  findById(tenantId: string, handoffId: HandoffId): Promise<HandoffRequest | null>;
  findByCall(tenantId: string, callId: string): Promise<readonly HandoffRequest[]>;
}
