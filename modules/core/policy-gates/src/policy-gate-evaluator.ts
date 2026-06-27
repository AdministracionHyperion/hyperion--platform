import type { ActorContext } from "../../identity-access/src/actor-context";
import { rolesAllow } from "../../identity-access/src/rbac-policy";
import type { OperationContext } from "../../../../packages/shared/src/core";
import { sanitizeMetadata } from "../../../../packages/shared/src/core";
import {
  metricNames,
  sanitizeLogMetadata,
  type LoggerPort,
  type MetricsRegistryPort,
} from "../../../../packages/observability/src";
import type { ApiAuditLikePort } from "./policy-gate-audit";
import type { PolicyGateAction } from "./policy-gate-action";
import type { PolicyGateReason } from "./policy-gate-reason";
import type { PolicyGateResult } from "./policy-gate-result";
import {
  getRuntimeActionRequirements,
  type RuntimeActionRequiredRef,
} from "./runtime-action-policy";
import { defaultRuntimeSafetyFlags, type RuntimeSafetyFlags } from "./runtime-safety-flags";
import { evaluateDataExposurePolicy } from "./data-exposure-policy";

export interface RuntimeActionPolicyInput {
  readonly context: OperationContext;
  readonly actor: ActorContext;
  readonly action: PolicyGateAction;
  readonly flags?: Partial<RuntimeSafetyFlags>;
  readonly metadata?: Readonly<Record<string, unknown>>;
  readonly humanApprovalRef?: string;
  readonly runbookRef?: string;
  readonly providerConfigRef?: string;
  readonly secretManagerRef?: string;
  readonly explicitApprovedActionRef?: string;
  readonly approvalRef?: string;
  readonly logger?: LoggerPort;
  readonly metrics?: MetricsRegistryPort;
  readonly audit?: ApiAuditLikePort;
}

export function evaluateRuntimeActionPolicy(input: RuntimeActionPolicyInput): PolicyGateResult {
  const flags = { ...defaultRuntimeSafetyFlags, ...input.flags };
  const requirements = getRuntimeActionRequirements(input.action);
  const reasons = new Set<PolicyGateReason>();

  for (const flag of requirements.requiredFlags) {
    if (!flags[flag]) {
      reasons.add(requirements.disabledReasonByFlag[flag] ?? "missing_permission");
    }
  }

  for (const permission of requirements.requiredPermissions) {
    if (!rolesAllow(input.actor.roles, permission)) {
      reasons.add("missing_permission");
    }
  }

  for (const ref of requirements.requiredRefs) {
    if (!hasRef(input, ref)) {
      reasons.add(reasonForMissingRef(ref));
    }
  }

  for (const reason of evaluateDataExposurePolicy({ flags, metadata: input.metadata }).reasons) {
    reasons.add(reason);
  }

  const result: PolicyGateResult = {
    allowed: reasons.size === 0,
    action: input.action,
    reasons: [...reasons],
    requiredFlags: requirements.requiredFlags,
    requiredPermissions: requirements.requiredPermissions,
    auditSeverity: reasons.size === 0 ? "info" : criticalityFor(input.action),
    metadata: sanitizeMetadata(input.metadata),
  };

  emitPolicyGateSideEffects(input, result);

  return result;
}

function hasRef(input: RuntimeActionPolicyInput, ref: RuntimeActionRequiredRef): boolean {
  const value = input[ref];
  return typeof value === "string" && value.trim().length > 0;
}

function reasonForMissingRef(ref: RuntimeActionRequiredRef): PolicyGateReason {
  switch (ref) {
    case "humanApprovalRef":
      return "missing_human_approval";
    case "runbookRef":
      return "missing_runbook";
    case "providerConfigRef":
      return "missing_provider_configuration";
    case "secretManagerRef":
      return "missing_secret_manager";
    case "explicitApprovedActionRef":
    case "approvalRef":
      return "missing_human_approval";
  }
}

function criticalityFor(action: PolicyGateAction): "warn" | "critical" {
  return action === "production.deploy" || action === "data.export" ? "critical" : "warn";
}

function emitPolicyGateSideEffects(
  input: RuntimeActionPolicyInput,
  result: PolicyGateResult,
): void {
  input.metrics?.increment(metricNames.policyGateEvaluationsTotal, {
    action: result.action,
    allowed: String(result.allowed),
  });
  if (!result.allowed) {
    input.metrics?.increment(metricNames.policyGateDeniedTotal, { action: result.action });
  }

  const logEntry = {
    message: result.allowed ? "policy.gate.allowed" : "policy.gate.denied",
    eventName: result.allowed ? "policy.gate.allowed" : "policy.gate.denied",
    tenantId: input.context.tenantId,
    actorId: input.context.actorId,
    correlationId: input.context.correlationId,
    metadata: sanitizeLogMetadata({
      action: result.action,
      reasons: [...result.reasons],
      severity: result.auditSeverity,
      resultMetadata: result.metadata,
    }),
  };

  if (result.allowed) {
    input.logger?.info(logEntry);
  } else {
    input.logger?.warn(logEntry);
  }

  if (!result.allowed) {
    void input.audit?.recordPolicyGateAudit?.({
      tenantId: input.context.tenantId,
      actorId: input.context.actorId,
      correlationId: input.context.correlationId,
      action: "policy.gate.denied",
      resourceType: "policy_gate",
      resourceId: result.action,
      result: "failure",
      metadata: {
        reasons: result.reasons,
        requiredFlags: result.requiredFlags,
        requiredPermissions: result.requiredPermissions,
      },
      occurredAt: input.context.occurredAt,
    });
  }
}
