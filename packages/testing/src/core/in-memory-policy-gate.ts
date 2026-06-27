import {
  evaluatePolicyGate,
  type PolicyGatePort,
  type PolicyGateResult,
  type RuntimeActionPolicyInput,
} from "../../../../modules/core/policy-gates/src";

export class InMemoryPolicyGate implements PolicyGatePort {
  public readonly evaluations: PolicyGateResult[] = [];

  async evaluate(input: RuntimeActionPolicyInput): Promise<PolicyGateResult> {
    const result = await evaluatePolicyGate(input);
    this.evaluations.push(result);
    return result;
  }

  clear(): void {
    this.evaluations.length = 0;
  }
}
