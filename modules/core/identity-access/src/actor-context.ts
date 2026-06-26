import type { ActorId } from "./actor-id";
import type { Role } from "./role";

export interface ActorContext {
  readonly actorId: ActorId;
  readonly tenantId?: string;
  readonly roles: readonly Role[];
}
