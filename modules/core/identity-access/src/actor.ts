import type { ActorId } from "./actor-id";

export type ActorStatus = "active" | "disabled";

export interface Actor {
  readonly actorId: ActorId;
  readonly displayName: string;
  readonly status: ActorStatus;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
