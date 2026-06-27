import {
  validateSafeIdentifier,
  type Brand,
  type DomainError,
  type Result,
} from "../../../../packages/shared/src/core";

export type FlowId = Brand<string, "FlowId">;

export function createFlowId(value: string): Result<FlowId, DomainError> {
  const validated = validateSafeIdentifier(value, "flowId");
  return validated.ok ? { ok: true, value: validated.value as FlowId } : validated;
}
