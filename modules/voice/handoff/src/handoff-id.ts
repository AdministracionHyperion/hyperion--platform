import { createCorrelationId, type Brand } from "../../../../packages/shared/src/core";

export type HandoffId = Brand<string, "HandoffId">;
export type HandoffRuleId = Brand<string, "HandoffRuleId">;

export function createHandoffId(): HandoffId {
  const correlationId = createCorrelationId();
  return (
    correlationId.ok ? `handoff-${correlationId.value}` : `handoff-${Date.now()}`
  ) as HandoffId;
}
