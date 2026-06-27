import { ok, type Result } from "../../../../../../packages/shared/src/core";
import {
  evaluateCedcoCompliancePolicy,
  type CedcoComplianceEvaluation,
} from "../cedco-compliance-policy";

export function evaluateCedcoCompliance(
  input: Parameters<typeof evaluateCedcoCompliancePolicy>[0],
): Result<CedcoComplianceEvaluation, never> {
  return ok(evaluateCedcoCompliancePolicy(input));
}
