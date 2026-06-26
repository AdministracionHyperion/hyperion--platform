import { ok, type Result } from "../../../../../../packages/shared/src/core";
import { evaluateCedcoHandoffPolicy, type CedcoHandoffEvaluation } from "../cedco-handoff-policy";

export function evaluateCedcoHandoff(
  input: Parameters<typeof evaluateCedcoHandoffPolicy>[0],
): Result<CedcoHandoffEvaluation, never> {
  return ok(evaluateCedcoHandoffPolicy(input));
}
