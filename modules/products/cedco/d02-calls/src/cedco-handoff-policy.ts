import type { HandoffPriority } from "../../../../voice/handoff/src";
import type { CedcoCallIntent } from "./cedco-call-intent";
import type { CedcoHandoffReason } from "./cedco-handoff-rule";

export interface CedcoHandoffEvaluation {
  readonly shouldHandoff: boolean;
  readonly reason?: CedcoHandoffReason;
  readonly priority: HandoffPriority;
}

export function evaluateCedcoHandoffPolicy(input: {
  readonly intent: CedcoCallIntent;
  readonly confidence?: number;
  readonly policyRisk?: boolean;
  readonly unknownKnowledgeAndUserInsists?: boolean;
  readonly integrationRequiredUnavailable?: boolean;
  readonly outOfScope?: boolean;
}): CedcoHandoffEvaluation {
  if (input.intent === "urgencia") {
    return { shouldHandoff: true, reason: "urgent_case", priority: "urgent" };
  }

  if (input.intent === "solicitar_humano") {
    return { shouldHandoff: true, reason: "user_requested_human", priority: "normal" };
  }

  if (input.intent === "opt_out") {
    return { shouldHandoff: true, reason: "opt_out_closure", priority: "normal" };
  }

  if ((input.confidence ?? 1) < 0.5) {
    return { shouldHandoff: true, reason: "low_confidence", priority: "high" };
  }

  if (input.policyRisk) {
    return { shouldHandoff: true, reason: "policy_risk", priority: "high" };
  }

  if (input.unknownKnowledgeAndUserInsists) {
    return { shouldHandoff: true, reason: "unknown_knowledge", priority: "normal" };
  }

  if (input.integrationRequiredUnavailable) {
    return { shouldHandoff: true, reason: "integration_required", priority: "normal" };
  }

  if (input.outOfScope) {
    return { shouldHandoff: true, reason: "out_of_scope", priority: "normal" };
  }

  return { shouldHandoff: false, priority: "low" };
}
