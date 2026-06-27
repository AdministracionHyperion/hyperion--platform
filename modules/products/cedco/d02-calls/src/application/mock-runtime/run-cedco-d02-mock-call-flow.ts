import {
  metricNames,
  type LoggerPort,
  type MetricsRegistryPort,
} from "../../../../../../../packages/observability/src";
import {
  domainError,
  fail,
  ok,
  sanitizeMetadata,
  type DomainError,
  type Result,
} from "../../../../../../../packages/shared/src/core";
import {
  MockCallRuntimeAdapter,
  type CallRuntimeEvent,
  type CallRuntimePort,
  type CallRuntimeSession,
} from "../../../../../../voice/call-runtime/src";
import {
  buildCedcoD02MockCallIntent,
  type CedcoD02MockCallIntentInput,
} from "./build-cedco-d02-mock-call-intent";
import { evaluateCedcoD02MockReadiness } from "./evaluate-cedco-d02-mock-readiness";
import { processCedcoD02MockPostCall } from "./process-cedco-d02-mock-post-call";

export interface CedcoD02MockAuditPort {
  record(event: {
    readonly tenantId: string;
    readonly actorId: string;
    readonly correlationId: string;
    readonly action: string;
    readonly resourceType: string;
    readonly resourceId: string;
    readonly result: "success" | "failure";
    readonly metadata?: Readonly<Record<string, unknown>>;
    readonly occurredAt: Date;
  }): Promise<void>;
}

export interface CedcoD02MockCallFlowResult {
  readonly flowId: string;
  readonly tenantId: string;
  readonly correlationId: string;
  readonly session: CallRuntimeSession;
  readonly events: readonly CallRuntimeEvent[];
  readonly status: "completed" | "blocked";
  readonly providerCallRef: string;
  readonly safeSummary: string;
  readonly disposition: string;
  readonly handoffRecommended: boolean;
  readonly metrics: ReturnType<typeof sanitizeMetadata>;
  readonly auditRefs: readonly string[];
}

export async function runCedcoD02MockCallFlow(input: {
  readonly intent: CedcoD02MockCallIntentInput;
  readonly runtime?: CallRuntimePort;
  readonly logger?: LoggerPort;
  readonly metrics?: MetricsRegistryPort;
  readonly audit?: CedcoD02MockAuditPort;
}): Promise<Result<CedcoD02MockCallFlowResult, DomainError>> {
  const intent = buildCedcoD02MockCallIntent(input.intent);
  if (!intent.ok) return fail(intent.error);

  input.metrics?.increment(metricNames.cedcoD02MockReadinessChecksTotal, {
    tenantId: intent.value.tenantId,
  });
  const readiness = evaluateCedcoD02MockReadiness(intent.value);
  if (!readiness.ok || !readiness.value.ready) {
    await input.audit?.record({
      tenantId: intent.value.tenantId,
      actorId: intent.value.actorId,
      correlationId: intent.value.correlationId,
      action: "cedco.d02.mock_flow.blocked",
      resourceType: "cedco_d02_mock_flow",
      resourceId: intent.value.callIntentId,
      result: "failure",
      metadata: { blockingReasons: readiness.ok ? readiness.value.blockingReasons : [] },
      occurredAt: new Date(),
    });
    return fail({
      ...domainError("invalid_state", "CEDCO D02 mock readiness blocked the flow"),
    });
  }

  input.metrics?.increment(metricNames.mockCallFlowsStartedTotal, {
    tenantId: intent.value.tenantId,
  });
  input.logger?.info({
    message: "cedco.d02.mock_flow.started",
    eventName: "cedco.d02.mock_flow.started",
    tenantId: intent.value.tenantId,
    actorId: intent.value.actorId,
    correlationId: intent.value.correlationId,
    metadata: { callIntentId: intent.value.callIntentId },
  });
  await input.audit?.record({
    tenantId: intent.value.tenantId,
    actorId: intent.value.actorId,
    correlationId: intent.value.correlationId,
    action: "cedco.d02.mock_flow.started",
    resourceType: "cedco_d02_mock_flow",
    resourceId: intent.value.callIntentId,
    result: "success",
    metadata: { runtimeMode: "mock" },
    occurredAt: new Date(),
  });

  const runtime = input.runtime ?? new MockCallRuntimeAdapter();
  const started = await runtime.startSession({
    tenantId: intent.value.tenantId,
    actorId: intent.value.actorId,
    correlationId: intent.value.correlationId,
    callIntentId: intent.value.callIntentId,
    productCode: "cedco-d02",
    runtimeMode: "mock",
    scriptId: intent.value.scriptId,
    safeContactRef: intent.value.safeContactRef,
    patientContextRef: intent.value.patientContextRef,
    consentRef: intent.value.consentRef,
    metadata: intent.value.metadata,
  });
  if (!started.ok) {
    input.metrics?.increment(metricNames.mockCallFlowsFailedTotal);
    return fail(domainError("invalid_state", started.error.message));
  }

  input.metrics?.increment(metricNames.mockCallRuntimeSessionsStartedTotal);
  for (const event of started.value.events) {
    const processed = await runtime.processEvent(event);
    if (!processed.ok) {
      input.metrics?.increment(metricNames.mockCallFlowsFailedTotal);
      return fail(domainError("invalid_state", processed.error.message));
    }
    input.metrics?.increment(metricNames.mockCallRuntimeEventsProcessedTotal, {
      eventType: event.type,
    });
  }

  const finalized = await runtime.finalizeSession(started.value.session.sessionId);
  if (!finalized.ok) {
    input.metrics?.increment(metricNames.mockCallFlowsFailedTotal);
    return fail(domainError("invalid_state", finalized.error.message));
  }
  input.metrics?.increment(metricNames.mockCallRuntimeSessionsCompletedTotal);

  const postCall = processCedcoD02MockPostCall(finalized.value.postCallResult);
  if (!postCall.ok) return fail(postCall.error);
  input.metrics?.increment(metricNames.cedcoD02MockPostCallProcessedTotal);
  input.metrics?.increment(metricNames.mockCallFlowsCompletedTotal);

  await input.audit?.record({
    tenantId: intent.value.tenantId,
    actorId: intent.value.actorId,
    correlationId: intent.value.correlationId,
    action: "cedco.d02.mock_flow.completed",
    resourceType: "cedco_d02_mock_flow",
    resourceId: finalized.value.session.sessionId,
    result: "success",
    metadata: { eventCount: started.value.events.length, runtimeMode: "mock" },
    occurredAt: new Date(),
  });

  return ok({
    flowId: `mock-flow-${intent.value.correlationId}`,
    tenantId: intent.value.tenantId,
    correlationId: intent.value.correlationId,
    session: finalized.value.session,
    events: started.value.events,
    status: "completed",
    providerCallRef: finalized.value.session.providerCallRef,
    safeSummary: postCall.value.safeSummary,
    disposition: postCall.value.disposition,
    handoffRecommended: postCall.value.handoffRecommended,
    metrics: postCall.value.metrics,
    auditRefs: [
      `audit-${intent.value.correlationId}-cedco.d02.mock_flow.started`,
      `audit-${intent.value.correlationId}-cedco.d02.mock_flow.completed`,
    ],
  });
}
