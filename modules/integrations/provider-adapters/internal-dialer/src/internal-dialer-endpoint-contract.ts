import type { SafeMetadata } from "../../../../../packages/shared/src/core";
import type { DialerBlockedReason } from "./dialer-blocked-reason";
import type { DialerDispatchResult } from "./dialer-dispatch-result";

export interface InternalDialerDryRunRequest {
  readonly idempotency_key?: string;
  readonly external_request_id?: string;
  readonly mode?: "single" | "campaign";
  readonly runtimeMode?: "dry_run" | "blocked" | "future_live";
  readonly safe_contact_ref: string;
  readonly agent_alias?: string;
  readonly caller_alias?: string;
  readonly dynamic_vars?: SafeMetadata;
  readonly consent: {
    readonly granted: boolean;
  };
  readonly consent_ref: string;
  readonly callback_alias?: string;
  readonly internal_event_topic?: string;
  readonly metadata?: SafeMetadata;
}

export interface InternalDialerDryRunResponse {
  readonly status: "blocked" | "dry_run_accepted" | "failed";
  readonly idempotency_key: string;
  readonly internal_call_id: string;
  readonly blocked_reasons: readonly DialerBlockedReason[];
  readonly would_call_provider: false;
  readonly provider_egress: false;
  readonly metadata: SafeMetadata;
}

export interface InternalDialerDispatchRequest extends InternalDialerDryRunRequest {
  readonly runtimeMode?: "future_live" | "blocked";
}

export interface InternalDialerDispatchBlockedResponse {
  readonly status: "blocked";
  readonly reason: "live_dispatch_disabled";
  readonly idempotency_key: string;
  readonly internal_call_id: string;
  readonly blocked_reasons: readonly DialerBlockedReason[];
  readonly would_call_provider: false;
  readonly provider_egress: false;
}

export function toInternalDialerDryRunResponse(
  result: DialerDispatchResult,
): InternalDialerDryRunResponse {
  return {
    status: result.status === "dry_run_accepted" ? "dry_run_accepted" : "blocked",
    idempotency_key: result.idempotencyKey,
    internal_call_id: result.internalCallId,
    blocked_reasons: result.blockedReasons,
    would_call_provider: false,
    provider_egress: false,
    metadata: result.metadata,
  };
}

export function toInternalDialerDispatchBlockedResponse(
  result: DialerDispatchResult,
): InternalDialerDispatchBlockedResponse {
  return {
    status: "blocked",
    reason: "live_dispatch_disabled",
    idempotency_key: result.idempotencyKey,
    internal_call_id: result.internalCallId,
    blocked_reasons: result.blockedReasons.includes("live_dispatch_disabled")
      ? result.blockedReasons
      : ["live_dispatch_disabled", ...result.blockedReasons],
    would_call_provider: false,
    provider_egress: false,
  };
}
