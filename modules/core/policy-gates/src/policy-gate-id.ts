import {
  fail,
  ok,
  type Result,
  domainError,
  type DomainError,
} from "../../../../packages/shared/src/core";

const safeIdPattern = /^[a-z0-9-]+$/u;

export type PolicyGateId = string & { readonly __brand: "PolicyGateId" };

export function createPolicyGateId(value: string): Result<PolicyGateId, DomainError> {
  const normalized = value.trim();
  if (!safeIdPattern.test(normalized)) {
    return fail(domainError("invalid_id", "PolicyGateId must be lowercase, numbers or hyphens."));
  }

  return ok(normalized as PolicyGateId);
}
