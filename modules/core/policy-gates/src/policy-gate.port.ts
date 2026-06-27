import type { PolicyGateResult } from "./policy-gate-result";
import type { RuntimeActionPolicyInput } from "./policy-gate-evaluator";

export interface PolicyGatePort {
  evaluate(input: RuntimeActionPolicyInput): Promise<PolicyGateResult>;
}
