import type { OperationContext } from "../../../../../packages/shared/src/core";
import {
  defaultRuntimeSafetyFlags,
  type RuntimeSafetyFlags,
} from "../../../../core/policy-gates/src";
import type { DialerBlockedReason } from "./dialer-blocked-reason";
import type { DialerDispatchRequest } from "./dialer-dispatch-request";
import {
  defaultDialerHardeningStatus,
  type DialerHardeningStatus,
} from "./dialer-hardening-status";

export interface InternalDialerPolicyInput {
  readonly request: DialerDispatchRequest;
  readonly context: OperationContext;
  readonly flags?: Partial<RuntimeSafetyFlags>;
  readonly hardeningStatus?: DialerHardeningStatus;
  readonly operation: "validate" | "dry_run" | "dispatch" | "status_read";
}

export function evaluateInternalDialerPolicy(
  input: InternalDialerPolicyInput,
): readonly DialerBlockedReason[] {
  const reasons = new Set<DialerBlockedReason>();
  const flags = { ...defaultRuntimeSafetyFlags, ...input.flags };
  const hardening = input.hardeningStatus ?? defaultDialerHardeningStatus;
  const request = input.request;

  for (const reason of validateIdempotencyKey(request.idempotencyKey)) reasons.add(reason);
  if (!request.externalRequestId.trim()) reasons.add("missing_external_request_id");
  if (!request.tenantId.trim()) reasons.add("missing_tenant_id");
  for (const reason of validateSafeContactRef(request.safeContactRef)) reasons.add(reason);
  if (!input.context.correlationId.trim()) reasons.add("missing_correlation_id");
  for (const reason of validateConsentContract(request.consent)) reasons.add(reason);
  if (hasExternalCallback(request)) reasons.add("external_callback_url_blocked");

  if (input.operation === "dry_run" && request.runtimeMode !== "dry_run") {
    reasons.add("runtime_mode_not_dry_run");
  }

  if (input.operation === "dispatch") {
    reasons.add("live_dispatch_disabled");
    if (!flags.realCallsEnabled) reasons.add("real_calls_disabled");
    if (!flags.providerEgressEnabled) reasons.add("provider_egress_disabled");
    if (!request.approvals?.approvalRef?.trim()) reasons.add("missing_approval_ref");
    if (!request.approvals?.runbookRef?.trim()) reasons.add("missing_runbook_ref");
    if (!request.approvals?.providerConfigRef?.trim()) reasons.add("missing_provider_config_ref");
    if (!request.approvals?.secretManagerRef?.trim()) reasons.add("missing_secret_manager_ref");
    if (!hardening.p0Complete) reasons.add("dialer_p0_hardening_incomplete");
  }

  return [...reasons];
}

export function validateIdempotencyKey(value: string): readonly DialerBlockedReason[] {
  if (!value.trim()) {
    return ["missing_idempotency_key"];
  }

  if (!/^[a-z0-9][a-z0-9._:-]{2,127}$/iu.test(value)) {
    return ["invalid_idempotency_key"];
  }

  return [];
}

export function validateSafeContactRef(value: string): readonly DialerBlockedReason[] {
  return value.trim() ? [] : ["missing_safe_contact_ref"];
}

export function validateConsentContract(
  consent: DialerDispatchRequest["consent"],
): readonly DialerBlockedReason[] {
  const reasons = new Set<DialerBlockedReason>();
  if (!consent.granted) reasons.add("missing_consent");
  if (!consent.consentRef.trim()) reasons.add("missing_consent_ref");
  return [...reasons];
}

function hasExternalCallback(request: DialerDispatchRequest): boolean {
  return Boolean(
    request.callback.callbackAlias?.match(/^https?:\/\//iu) ||
    request.callback.internalEventTopic?.match(/^https?:\/\//iu),
  );
}
