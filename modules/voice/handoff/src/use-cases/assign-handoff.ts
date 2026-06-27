import {
  domainError,
  fail,
  ok,
  type DomainError,
  type OperationContext,
  type Result,
} from "../../../../../packages/shared/src/core";
import type { ActorContext } from "../../../../core/identity-access/src/actor-context";
import { rolesAllow } from "../../../../core/identity-access/src/rbac-policy";
import type { HandoffId } from "../handoff-id";
import type { HandoffRepositoryPort } from "../handoff-repository.port";
import type { HandoffRequest } from "../handoff-request";

export interface AssignHandoffInput {
  readonly context: OperationContext;
  readonly actor: ActorContext;
  readonly repository: HandoffRepositoryPort;
  readonly handoffId: HandoffId;
  readonly assignedToActorId: string;
}

export async function assignHandoff(
  input: AssignHandoffInput,
): Promise<Result<HandoffRequest, DomainError>> {
  if (!rolesAllow(input.actor.roles, "voice:handoff:manage")) {
    return fail(domainError("forbidden", "actor cannot assign handoff"));
  }

  const request = await input.repository.findById(input.context.tenantId, input.handoffId);
  if (!request) {
    return fail(domainError("not_found", "handoff request not found"));
  }

  const assigned: HandoffRequest = {
    ...request,
    status: "assigned",
    assignedToActorId: input.assignedToActorId,
    assignedAt: input.context.occurredAt,
  };
  await input.repository.save(assigned);
  return ok(assigned);
}
