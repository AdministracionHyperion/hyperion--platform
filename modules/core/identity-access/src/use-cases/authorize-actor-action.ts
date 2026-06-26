import { ok, type Result } from "../../../../../packages/shared/src/core";
import type { OperationContext } from "../../../../../packages/shared/src/core";
import type { ActorContext } from "../actor-context";
import { authorizationError, type AuthorizationError } from "../authorization-error";
import type { Permission } from "../permission";
import { rolesAllow } from "../rbac-policy";

export interface AuthorizeActorActionInput {
  readonly actor: ActorContext;
  readonly context: OperationContext;
  readonly permission: Permission;
}

export function authorizeActorAction(
  input: AuthorizeActorActionInput,
): Result<true, AuthorizationError> {
  if (input.actor.actorId !== input.context.actorId) {
    return { ok: false, error: authorizationError(input.permission) };
  }

  if (!rolesAllow(input.actor.roles, input.permission)) {
    return { ok: false, error: authorizationError(input.permission) };
  }

  return ok(true);
}
