import type { CallId } from "./call-id";
import type { CallEvent } from "./call-event";

export interface CallEventRepositoryPort {
  append(event: CallEvent): Promise<void>;
  findByCall(tenantId: string, callId: CallId): Promise<readonly CallEvent[]>;
}
