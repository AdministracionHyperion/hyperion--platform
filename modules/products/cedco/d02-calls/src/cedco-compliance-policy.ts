import { isSensitiveMetadataKey } from "../../../../../packages/shared/src/core";
import type { CedcoCallIntent } from "./cedco-call-intent";
import { evaluateCedcoNoClinicalTriagePolicy } from "./cedco-no-clinical-triage-policy";

export interface CedcoComplianceEvaluation {
  readonly allowed: boolean;
  readonly blocked: boolean;
  readonly reasons: readonly string[];
  readonly handoffRequired: boolean;
  readonly closureRequired: boolean;
}

export function evaluateCedcoCompliancePolicy(input: {
  readonly textRedacted?: string;
  readonly intent?: CedcoCallIntent;
  readonly metadata?: Readonly<Record<string, unknown>>;
  readonly optOut?: boolean;
}): CedcoComplianceEvaluation {
  const reasons: string[] = [];
  const metadata = input.metadata ?? {};

  for (const key of Object.keys(metadata)) {
    if (isSensitiveMetadataKey(key) || key === "from_number") {
      reasons.push(`sensitive_metadata:${key}`);
    }
  }

  const clinical = evaluateCedcoNoClinicalTriagePolicy(input.textRedacted ?? "");
  reasons.push(...clinical.reasons);

  if (input.intent === "urgencia") {
    reasons.push("urgent_case_handoff_without_diagnosis");
  }

  if (input.intent === "opt_out" || input.optOut) {
    reasons.push("opt_out_closure_required");
  }

  const blockingReasons = reasons.filter(
    (reason) => reason.startsWith("sensitive_metadata") || clinical.blockedReasons.includes(reason),
  );

  return {
    allowed: blockingReasons.length === 0,
    blocked: blockingReasons.length > 0,
    reasons,
    handoffRequired:
      input.intent === "urgencia" ||
      input.intent === "opt_out" ||
      clinical.blockedReasons.length > 0 ||
      blockingReasons.length > 0,
    closureRequired: input.intent === "opt_out" || input.optOut === true,
  };
}
