import type { OperationContext } from "../../../../../packages/shared/src/core";
import type { RuntimeSafetyFlags } from "../../../../core/policy-gates/src";
import { sanitizeDialerContractPayload } from "./dialer-contract-sanitizer";
import type { DialerBlockedReason } from "./dialer-blocked-reason";
import type { DialerDispatchRequest } from "./dialer-dispatch-request";
import { type DialerDispatchResult } from "./dialer-dispatch-result";
import type { DialerHardeningStatus } from "./dialer-hardening-status";
import { evaluateInternalDialerPolicy } from "./internal-dialer-policy";

export function validateInternalDialerRequest(input: {
  readonly request: DialerDispatchRequest;
  readonly context: OperationContext;
  readonly flags?: Partial<RuntimeSafetyFlags>;
  readonly hardeningStatus?: DialerHardeningStatus;
  readonly operation: "validate" | "dry_run" | "dispatch" | "status_read";
}): DialerDispatchResult {
  const policyReasons = evaluateInternalDialerPolicy(input);
  const sanitization = sanitizeDialerContractPayload(input.request, policyReasons);
  const blockedReasons = sanitization.reasons;
  const idempotencyKey = input.request.idempotencyKey || "missing";

  return {
    internalCallId: `dryrun_${idempotencyKey}`,
    externalRequestId: input.request.externalRequestId,
    status: blockedReasons.length > 0 ? "blocked" : "dry_run_accepted",
    idempotencyKey,
    wouldCallProvider: false,
    providerEgress: false,
    ...(blockedReasons.includes("live_dispatch_disabled")
      ? { reason: "live_dispatch_disabled" as const }
      : {}),
    blockedReasons: blockedReasons as readonly DialerBlockedReason[],
    metadata:
      blockedReasons.length > 0
        ? { source: "internal_dialer_contract_blocked", blocked: true }
        : sanitization.metadata,
  };
}
