import type { SafeMetadata } from "../../../../../packages/shared/src/core";
import type { HandoffPriority } from "../../../../voice/handoff/src";
import type { CedcoCallIntent } from "./cedco-call-intent";

export interface CedcoHandoffRule {
  readonly handoffRuleId: string;
  readonly tenantId: string;
  readonly intent?: CedcoCallIntent;
  readonly reason: CedcoHandoffReason;
  readonly priority: HandoffPriority;
  readonly enabled: boolean;
  readonly metadata: SafeMetadata;
}

export type CedcoHandoffReason =
  | "user_requested_human"
  | "urgent_case"
  | "low_confidence"
  | "policy_risk"
  | "unknown_knowledge"
  | "integration_required"
  | "out_of_scope"
  | "opt_out_closure";
