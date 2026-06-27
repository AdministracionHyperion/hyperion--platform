import {
  domainError,
  fail,
  ok,
  type DomainError,
  type Result,
} from "../../../../../packages/shared/src/core";
import { evaluatePolicyGate } from "./evaluate-policy-gate";
import type { RuntimeActionPolicyInput } from "../policy-gate-evaluator";
import type { PolicyGateResult } from "../policy-gate-result";

export async function assertRuntimeActionAllowed(
  input: RuntimeActionPolicyInput,
): Promise<Result<PolicyGateResult, DomainError>> {
  const result = await evaluatePolicyGate(input);
  if (!result.allowed) {
    return fail(
      domainError("forbidden", "Runtime action is blocked by policy gate.", {
        action: result.action,
        reasons: result.reasons.join(","),
      }),
    );
  }

  return ok(result);
}
