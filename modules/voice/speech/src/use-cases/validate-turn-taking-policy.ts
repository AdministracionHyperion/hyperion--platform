import {
  domainError,
  fail,
  ok,
  type DomainError,
  type Result,
} from "../../../../../packages/shared/src/core";
import type { TurnTakingPolicy } from "../turn-taking-policy";

export function validateTurnTakingPolicy(policy: TurnTakingPolicy): Result<true, DomainError> {
  if (policy.maxSilenceMs <= 0 || policy.maxTurnDurationMs <= 0) {
    return fail(domainError("invalid_state", "turn-taking durations must be positive"));
  }

  if (policy.maxSilenceMs >= policy.maxTurnDurationMs) {
    return fail(domainError("invalid_state", "maxSilenceMs must be lower than maxTurnDurationMs"));
  }

  if (!policy.allowBargeIn && policy.interruptionStrategy === "barge_in") {
    return fail(domainError("invalid_state", "barge_in strategy requires allowBargeIn"));
  }

  return ok(true);
}
