import type { PolicyGateAction } from "./policy-gate-action";
import {
  evaluateRuntimeActionPolicy,
  type RuntimeActionPolicyInput,
} from "./policy-gate-evaluator";
import type { PolicyGateResult } from "./policy-gate-result";

export function evaluateRealCallPolicy(
  input: Omit<RuntimeActionPolicyInput, "action"> & { readonly action?: PolicyGateAction },
): PolicyGateResult {
  return evaluateRuntimeActionPolicy({
    ...input,
    action: input.action ?? "call.dispatch",
  });
}
