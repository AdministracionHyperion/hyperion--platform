import {
  validateSafeIdentifier,
  type Brand,
  type DomainError,
  type Result,
} from "../../../../packages/shared/src/core";

export type ActorId = Brand<string, "ActorId">;

export function createActorId(value: string): Result<ActorId, DomainError> {
  const validated = validateSafeIdentifier(value, "actorId");
  return validated.ok ? { ok: true, value: validated.value as ActorId } : validated;
}
