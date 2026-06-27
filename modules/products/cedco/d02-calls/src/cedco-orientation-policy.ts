import {
  domainError,
  fail,
  ok,
  type DomainError,
  type Result,
} from "../../../../../packages/shared/src/core";

export interface CedcoOrientationPolicyInput {
  readonly knownSite?: boolean;
  readonly knownService?: boolean;
  readonly knownAgreement?: boolean;
  readonly asksForRealConfirmation?: boolean;
  readonly clinicalRequest?: boolean;
}

export function evaluateCedcoOrientationPolicy(
  input: CedcoOrientationPolicyInput,
): Result<true, DomainError> {
  if (input.clinicalRequest) {
    return fail(domainError("invalid_state", "clinical orientation is not allowed"));
  }

  if (input.asksForRealConfirmation) {
    return fail(domainError("invalid_state", "real confirmation requires integration"));
  }

  if (input.knownSite === false || input.knownService === false || input.knownAgreement === false) {
    return fail(domainError("invalid_state", "unknown CEDCO knowledge must not be invented"));
  }

  return ok(true);
}
