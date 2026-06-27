import type { SafeMetadata } from "../../../../../packages/shared/src/core";
import type { CedcoCallIntent } from "./cedco-call-intent";
import type { CedcoCallObjective } from "./cedco-call-objective";

export interface CedcoD02CallReadiness {
  readonly tenantId: string;
  readonly objective: CedcoCallObjective;
  readonly intent?: CedcoCallIntent;
  readonly ready: boolean;
  readonly blockingReasons: readonly CedcoD02ReadinessBlockingReason[];
  readonly warnings: readonly string[];
  readonly nextStep: string;
  readonly checkedAt: Date;
  readonly metadata: SafeMetadata;
}

export type CedcoD02ReadinessBlockingReason =
  | "missing_agent_version"
  | "missing_knowledge_base_version"
  | "unknown_site"
  | "unknown_service"
  | "unknown_agreement"
  | "scheduling_mode_incoherent"
  | "eligibility_mode_incoherent"
  | "pii_policy_violation"
  | "real_calls_disabled";
