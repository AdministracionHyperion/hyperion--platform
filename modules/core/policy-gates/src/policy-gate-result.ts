import type { Permission } from "../../identity-access/src/permission";
import type { SafeMetadata } from "../../../../packages/shared/src/core";
import type { PolicyGateAction } from "./policy-gate-action";
import type { PolicyGateReason } from "./policy-gate-reason";
import type { RuntimeSafetyFlags } from "./runtime-safety-flags";

export type PolicyGateAuditSeverity = "info" | "warn" | "critical";

export interface PolicyGateResult {
  readonly allowed: boolean;
  readonly action: PolicyGateAction;
  readonly reasons: readonly PolicyGateReason[];
  readonly requiredFlags: readonly (keyof RuntimeSafetyFlags)[];
  readonly requiredPermissions: readonly Permission[];
  readonly auditSeverity: PolicyGateAuditSeverity;
  readonly metadata: SafeMetadata;
}
