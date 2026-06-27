import type { OperationContext } from "../../../../../packages/shared/src/core";
import type {
  DialerDispatchRequest,
  DialerDispatchResult,
  InternalDialerClientPort,
} from "../../../../../modules/integrations/provider-adapters/internal-dialer/src";

export class FakeInternalDialerClient implements InternalDialerClientPort {
  public readonly networkCallsMade = 0;

  public async dryRun(
    request: DialerDispatchRequest,
    _context: OperationContext,
  ): Promise<DialerDispatchResult> {
    return safeResult(request, "dry_run_accepted");
  }

  public async dispatch(
    request: DialerDispatchRequest,
    _context: OperationContext,
  ): Promise<DialerDispatchResult> {
    return safeResult(request, "blocked");
  }

  public async getStatus(
    requestId: string,
    _context: OperationContext,
  ): Promise<DialerDispatchResult> {
    return {
      internalCallId: `fake_internal_dialer_${requestId}`,
      externalRequestId: requestId,
      status: "blocked",
      idempotencyKey: requestId,
      wouldCallProvider: false,
      providerEgress: false,
      reason: "live_dispatch_disabled",
      blockedReasons: ["live_dispatch_disabled", "dialer_p0_hardening_incomplete"],
      metadata: { fake: true },
    };
  }
}

function safeResult(
  request: DialerDispatchRequest,
  status: DialerDispatchResult["status"],
): DialerDispatchResult {
  return {
    internalCallId: `fake_internal_dialer_${request.externalRequestId}`,
    externalRequestId: request.externalRequestId,
    status,
    idempotencyKey: request.idempotencyKey,
    wouldCallProvider: false,
    providerEgress: false,
    ...(status === "blocked" ? { reason: "live_dispatch_disabled" as const } : {}),
    blockedReasons:
      status === "blocked" ? ["live_dispatch_disabled", "dialer_p0_hardening_incomplete"] : [],
    metadata: { fake: true },
  };
}
