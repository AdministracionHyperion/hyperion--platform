import type { ActorId } from "../../identity-access/src/actor-id";
import type { Role } from "../../identity-access/src/role";
import type { TenantId } from "./tenant-id";

export type TenantMembershipStatus = "active" | "suspended" | "revoked";

export interface TenantMembership {
  readonly tenantId: TenantId;
  readonly actorId: ActorId;
  readonly roles: readonly Role[];
  readonly status: TenantMembershipStatus;
}
