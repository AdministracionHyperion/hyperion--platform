import type { PolicyGateResult } from "../../../../modules/core/policy-gates/src";
import { policyBlockedError, validationError } from "../http/api-error";

export function policyGateToApiError(result: PolicyGateResult) {
  return policyBlockedError("Request is blocked by runtime safety policy.", {
    action: result.action,
    reasons: result.reasons,
    requiredFlags: result.requiredFlags,
    requiredPermissions: result.requiredPermissions,
  });
}

export function dangerousPayloadError(fieldPath: string) {
  return validationError("Dangerous or sensitive payload field is not allowed.", {
    field: fieldPath,
  });
}
