import type { HandoffId } from "./handoff-id";

export interface HandoffAssignment {
  readonly handoffId: HandoffId;
  readonly tenantId: string;
  readonly assignedToActorId: string;
  readonly assignedAt: Date;
}
