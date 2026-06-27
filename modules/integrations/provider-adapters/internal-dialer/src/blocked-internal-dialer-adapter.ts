import type { OperationContext, SafeMetadata } from "../../../../../packages/shared/src/core";
import {
  metricNames,
  sanitizeLogMetadata,
  type LoggerPort,
  type MetricsRegistryPort,
} from "../../../../../packages/observability/src";
import type { RuntimeSafetyFlags } from "../../../../core/policy-gates/src";
import type { DialerDispatchRequest } from "./dialer-dispatch-request";
import type { DialerDispatchResult } from "./dialer-dispatch-result";
import {
  defaultDialerHardeningStatus,
  type DialerHardeningStatus,
} from "./dialer-hardening-status";
import type { InternalDialerAdapterPort } from "./internal-dialer-adapter.port";
import { validateInternalDialerRequest } from "./internal-dialer-request-validator";

export interface BlockedInternalDialerAdapterInput {
  readonly flags?: Partial<RuntimeSafetyFlags>;
  readonly hardeningStatus?: DialerHardeningStatus;
  readonly logger?: LoggerPort;
  readonly metrics?: MetricsRegistryPort;
}

export class BlockedInternalDialerAdapter implements InternalDialerAdapterPort {
  private readonly flags?: Partial<RuntimeSafetyFlags>;
  private readonly hardeningStatus: DialerHardeningStatus;
  private readonly logger?: LoggerPort;
  private readonly metrics?: MetricsRegistryPort;

  public constructor(input: BlockedInternalDialerAdapterInput = {}) {
    this.flags = input.flags;
    this.hardeningStatus = input.hardeningStatus ?? defaultDialerHardeningStatus;
    this.logger = input.logger;
    this.metrics = input.metrics;
  }

  public async validateRequest(
    request: DialerDispatchRequest,
    context: OperationContext,
  ): Promise<DialerDispatchResult> {
    const result = validateInternalDialerRequest({
      request,
      context,
      flags: this.flags,
      hardeningStatus: this.hardeningStatus,
      operation: "validate",
    });
    this.emit("internal_dialer.validate", result, context);
    return result;
  }

  public async dryRun(
    request: DialerDispatchRequest,
    context: OperationContext,
  ): Promise<DialerDispatchResult> {
    const result = validateInternalDialerRequest({
      request,
      context,
      flags: this.flags,
      hardeningStatus: this.hardeningStatus,
      operation: "dry_run",
    });
    this.emit("internal_dialer.dry_run", result, context);
    return result;
  }

  public async dispatch(
    request: DialerDispatchRequest,
    context: OperationContext,
  ): Promise<DialerDispatchResult> {
    const result = validateInternalDialerRequest({
      request,
      context,
      flags: this.flags,
      hardeningStatus: this.hardeningStatus,
      operation: "dispatch",
    });
    const blocked: DialerDispatchResult = {
      ...result,
      status: "blocked",
      blockedReasons:
        result.blockedReasons.length > 0
          ? result.blockedReasons
          : ["dialer_p0_hardening_incomplete"],
    };
    this.emit("internal_dialer.dispatch_blocked", blocked, context);
    return blocked;
  }

  public async getStatus(
    requestId: string,
    context: OperationContext,
  ): Promise<DialerDispatchResult> {
    const result: DialerDispatchResult = {
      internalCallId: `internal_dialer_${requestId}`,
      externalRequestId: requestId,
      status: "blocked",
      idempotencyKey: requestId,
      blockedReasons: ["dialer_p0_hardening_incomplete"],
      metadata: { source: "blocked_internal_dialer_adapter" } as SafeMetadata,
    };
    this.emit("internal_dialer.status_read", result, context);
    return result;
  }

  public async normalizeResult(
    result: DialerDispatchResult,
    context: OperationContext,
  ): Promise<DialerDispatchResult> {
    const normalized = {
      ...result,
      providerConversationRef: result.providerConversationRef?.startsWith("safe_provider_")
        ? result.providerConversationRef
        : undefined,
      metadata: sanitizeLogMetadata(result.metadata) as SafeMetadata,
    };
    this.emit("internal_dialer.result_normalized", normalized, context);
    return normalized;
  }

  private emit(eventName: string, result: DialerDispatchResult, context: OperationContext): void {
    this.metrics?.increment(
      result.status === "dry_run_accepted"
        ? metricNames.policyGateEvaluationsTotal
        : metricNames.providerBlockedRequestsTotal,
      {
        component: "internal_dialer",
        status: result.status,
      },
    );
    const entry = {
      message: eventName,
      eventName,
      tenantId: context.tenantId,
      actorId: context.actorId,
      correlationId: context.correlationId,
      metadata: sanitizeLogMetadata({
        externalRequestId: result.externalRequestId,
        status: result.status,
        blockedReasons: result.blockedReasons,
      }),
    };
    if (result.status === "dry_run_accepted") {
      this.logger?.info(entry);
    } else {
      this.logger?.warn(entry);
    }
  }
}
