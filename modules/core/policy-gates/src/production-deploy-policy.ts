import {
  evaluateRuntimeActionPolicy,
  type RuntimeActionPolicyInput,
} from "./policy-gate-evaluator";
import type { PolicyGateResult } from "./policy-gate-result";

export function evaluateProductionDeployPolicy(
  input: Omit<RuntimeActionPolicyInput, "action">,
): PolicyGateResult {
  return evaluateRuntimeActionPolicy({
    ...input,
    action: "production.deploy",
  });
}
