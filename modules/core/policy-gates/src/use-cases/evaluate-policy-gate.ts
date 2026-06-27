import type { PolicyGateResult } from "../policy-gate-result";
import {
  evaluateRuntimeActionPolicy,
  type RuntimeActionPolicyInput,
} from "../policy-gate-evaluator";

export async function evaluatePolicyGate(
  input: RuntimeActionPolicyInput,
): Promise<PolicyGateResult> {
  return evaluateRuntimeActionPolicy(input);
}
