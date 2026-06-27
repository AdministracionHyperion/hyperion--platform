import {
  evaluateRuntimeActionPolicy,
  type RuntimeActionPolicyInput,
} from "./policy-gate-evaluator";
import type { PolicyGateResult } from "./policy-gate-result";

export function evaluateProviderEgressPolicy(
  input: Omit<RuntimeActionPolicyInput, "action">,
): PolicyGateResult {
  return evaluateRuntimeActionPolicy({
    ...input,
    action: "provider.egress",
  });
}
