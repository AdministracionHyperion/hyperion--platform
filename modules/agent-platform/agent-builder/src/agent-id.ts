import {
  validateSafeIdentifier,
  type Brand,
  type DomainError,
  type Result,
} from "../../../../packages/shared/src/core";

export type AgentId = Brand<string, "AgentId">;

export function createAgentId(value: string): Result<AgentId, DomainError> {
  const validated = validateSafeIdentifier(value, "agentId");
  return validated.ok ? { ok: true, value: validated.value as AgentId } : validated;
}
