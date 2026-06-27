import { createOperationContext } from "../../../shared/src/core";
import type { ActorContext } from "../../../../modules/core/identity-access/src";
import type { RuntimeSafetyFlags } from "../../../../modules/core/policy-gates/src";
import { defaultRuntimeSafetyFlags } from "../../../../modules/core/policy-gates/src";

export function createTestPolicyGateContext() {
  const context = createOperationContext({
    tenantId: "cedco-test",
    actorId: "actor-test",
    correlationId: "corr-policy-test",
    source: "test",
  });
  if (!context.ok) {
    throw new Error(context.error.message);
  }

  return context.value;
}

export function createTestPolicyGateActorContext(
  roles: ActorContext["roles"] = ["tenant-admin"],
): ActorContext {
  return {
    actorId: "actor-test" as ActorContext["actorId"],
    tenantId: "cedco-test",
    roles,
  };
}

export function createRuntimeSafetyFlags(
  overrides: Partial<RuntimeSafetyFlags> = {},
): RuntimeSafetyFlags {
  return { ...defaultRuntimeSafetyFlags, ...overrides };
}
