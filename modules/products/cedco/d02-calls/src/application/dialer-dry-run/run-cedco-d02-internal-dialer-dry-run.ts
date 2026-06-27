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
  type SafeMetadata,
} from "../../../../../../../packages/shared/src/core";
import type { CedcoCallObjective } from "../../cedco-call-objective";
import type { CedcoCallPurpose } from "../../cedco-call-purpose";

export interface CedcoD02DialerDryRunInput {
  readonly tenantId: string;
  readonly actorId: string;
  readonly correlationId: string;
  readonly idempotencyKey?: string;
  readonly externalRequestId?: string;
  readonly safeContactRef: string;
  readonly patientContextRef?: string;
  readonly cedcoSiteId?: string;
  readonly serviceId?: string;
  readonly agreementId?: string;
  readonly callPurpose?: CedcoCallPurpose;
  readonly objective?: CedcoCallObjective;
  readonly consent: {
    readonly granted: boolean;
  };
  readonly consentRef: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
  readonly dynamicVars?: Readonly<Record<string, unknown>>;
}

export interface CedcoD02InternalDialerDryRunRequest {
  readonly idempotency_key?: string;
  readonly external_request_id?: string;
  readonly mode: "single";
  readonly runtimeMode: "dry_run";
  readonly safe_contact_ref: string;
  readonly agent_alias: string;
  readonly caller_alias: string;
  readonly consent: {
    readonly granted: boolean;
  };
  readonly consent_ref: string;
  readonly callback_alias?: string;
  readonly internal_event_topic: string;
  readonly dynamic_vars: SafeMetadata;
  readonly metadata: SafeMetadata;
}

export interface CedcoD02InternalDialerDryRunResult {
  readonly status: "blocked" | "dry_run_accepted" | "failed";
  readonly idempotency_key: string;
  readonly internal_call_id: string;
  readonly blocked_reasons: readonly string[];
  readonly would_call_provider: false;
  readonly provider_egress: false;
  readonly metadata?: SafeMetadata;
}

export interface CedcoD02InternalDialerDryRunPort {
  dryRun(request: CedcoD02InternalDialerDryRunRequest): Promise<CedcoD02InternalDialerDryRunResult>;
}

export interface CedcoD02DialerDryRunAuditPort {
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

export interface CedcoD02DialerDryRunResult {
  readonly flowId: string;
  readonly tenantId: string;
  readonly correlationId: string;
  readonly status: "blocked" | "dry_run_accepted";
  readonly idempotencyKeyRef: string;
  readonly internalCallId: string;
  readonly safeContactRef: string;
  readonly blockedReasons: readonly string[];
  readonly wouldCallProvider: false;
  readonly providerEgress: false;
  readonly auditRefs: readonly string[];
  readonly metadata: SafeMetadata;
}

const forbiddenDialerDryRunKeys = new Set([
  "phone",
  "phoneNumber",
  "to_number",
  "from_number",
  "agent_id",
  "phone_number_id",
  "rawTranscript",
  "transcript",
  "audioUrl",
  "recordingUrl",
  "audio_b64",
  "rawPayload",
  "apiKey",
  "api_key",
  "token",
  "secret",
  "password",
]);

export async function runCedcoD02InternalDialerDryRun(input: {
  readonly intent: CedcoD02DialerDryRunInput;
  readonly dialer: CedcoD02InternalDialerDryRunPort;
  readonly audit?: CedcoD02DialerDryRunAuditPort;
  readonly logger?: LoggerPort;
  readonly metrics?: MetricsRegistryPort;
}): Promise<Result<CedcoD02DialerDryRunResult, DomainError>> {
  const forbidden = findForbiddenDialerDryRunPayloadKey(input.intent);
  if (forbidden) {
    return fail(
      domainError("invalid_metadata", `CEDCO D02 dialer dry-run contains forbidden ${forbidden}`),
    );
  }

  const request = buildCedcoD02InternalDialerDryRunRequest(input.intent);
  const flowId = `cedco-d02-dialer-dry-run-${input.intent.correlationId}`;
  const idempotencyKeyRef = `idempotency-${input.intent.correlationId}`;

  input.metrics?.increment(metricNames.cedcoD02RequestsTotal, {
    operation: "dialer_dry_run",
    tenantId: input.intent.tenantId,
  });
  input.logger?.info({
    message: "cedco.d02.dialer_dry_run.requested",
    eventName: "cedco.d02.dialer_dry_run.requested",
    tenantId: input.intent.tenantId,
    actorId: input.intent.actorId,
    correlationId: input.intent.correlationId,
    metadata: {
      flowId,
      safeContactRef: input.intent.safeContactRef,
      idempotencyKeyRef,
    },
  });
  await input.audit?.record({
    tenantId: input.intent.tenantId,
    actorId: input.intent.actorId,
    correlationId: input.intent.correlationId,
    action: "cedco.d02.dialer_dry_run_requested",
    resourceType: "cedco_d02_dialer_dry_run",
    resourceId: flowId,
    result: "success",
    metadata: {
      idempotencyKeyRef,
      safeContactRef: input.intent.safeContactRef,
      providerEgress: false,
      wouldCallProvider: false,
    },
    occurredAt: new Date(),
  });

  const dryRun = await input.dialer.dryRun(request);
  if (dryRun.provider_egress !== false || dryRun.would_call_provider !== false) {
    await input.audit?.record({
      tenantId: input.intent.tenantId,
      actorId: input.intent.actorId,
      correlationId: input.intent.correlationId,
      action: "cedco.d02.dialer_dry_run_blocked",
      resourceType: "cedco_d02_dialer_dry_run",
      resourceId: flowId,
      result: "failure",
      metadata: { idempotencyKeyRef, reason: "provider_egress_detected" },
      occurredAt: new Date(),
    });
    return fail(domainError("forbidden", "Dialer dry-run attempted provider egress"));
  }

  const accepted = dryRun.status === "dry_run_accepted";
  const finalAction = accepted
    ? "cedco.d02.dialer_dry_run_accepted"
    : "cedco.d02.dialer_dry_run_blocked";
  await input.audit?.record({
    tenantId: input.intent.tenantId,
    actorId: input.intent.actorId,
    correlationId: input.intent.correlationId,
    action: finalAction,
    resourceType: "cedco_d02_dialer_dry_run",
    resourceId: dryRun.internal_call_id,
    result: accepted ? "success" : "failure",
    metadata: {
      idempotencyKeyRef,
      safeContactRef: input.intent.safeContactRef,
      status: dryRun.status,
      providerEgress: false,
      wouldCallProvider: false,
      blockedReasons: dryRun.blocked_reasons,
    },
    occurredAt: new Date(),
  });

  return ok({
    flowId,
    tenantId: input.intent.tenantId,
    correlationId: input.intent.correlationId,
    status: accepted ? "dry_run_accepted" : "blocked",
    idempotencyKeyRef,
    internalCallId: dryRun.internal_call_id,
    safeContactRef: input.intent.safeContactRef,
    blockedReasons: dryRun.blocked_reasons,
    wouldCallProvider: false,
    providerEgress: false,
    auditRefs: [
      `audit-${input.intent.correlationId}-cedco.d02.dialer_dry_run_requested`,
      `audit-${input.intent.correlationId}-${finalAction}`,
    ],
    metadata: sanitizeMetadata({
      source: "cedco_d02_dialer_dry_run",
      status: dryRun.status,
      ...dryRun.metadata,
    }),
  });
}

export function buildCedcoD02InternalDialerDryRunRequest(
  input: CedcoD02DialerDryRunInput,
): CedcoD02InternalDialerDryRunRequest {
  return {
    ...(input.idempotencyKey ? { idempotency_key: input.idempotencyKey } : {}),
    external_request_id:
      input.externalRequestId ?? input.idempotencyKey ?? `cedco-d02-${input.correlationId}`,
    mode: "single",
    runtimeMode: "dry_run",
    safe_contact_ref: input.safeContactRef,
    agent_alias: "cedco-d02-agent",
    caller_alias: "cedco-d02-caller",
    consent: { granted: input.consent.granted },
    consent_ref: input.consentRef,
    internal_event_topic: "internal.events.cedco.d02.dialer_dry_run",
    dynamic_vars: sanitizeMetadata({
      ...input.dynamicVars,
      productCode: "cedco-d02",
      ...(input.callPurpose ? { callPurpose: input.callPurpose } : {}),
      ...(input.objective ? { objective: input.objective } : {}),
      ...(input.cedcoSiteId ? { cedcoSiteId: input.cedcoSiteId } : {}),
      ...(input.serviceId ? { serviceId: input.serviceId } : {}),
      ...(input.agreementId ? { agreementId: input.agreementId } : {}),
    }),
    metadata: sanitizeMetadata({
      ...input.metadata,
      source: "cedco_d02_dialer_dry_run",
      ...(input.patientContextRef ? { patientContextRef: input.patientContextRef } : {}),
      ...(input.cedcoSiteId ? { siteRef: input.cedcoSiteId } : {}),
      ...(input.serviceId ? { serviceRef: input.serviceId } : {}),
      ...(input.agreementId ? { agreementRef: input.agreementId } : {}),
    }),
  };
}

export function findForbiddenDialerDryRunPayloadKey(
  value: unknown,
  path = "payload",
): string | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  if (Array.isArray(value)) {
    for (const [index, item] of value.entries()) {
      const nested = findForbiddenDialerDryRunPayloadKey(item, `${path}.${index}`);
      if (nested) return nested;
    }
    return undefined;
  }

  for (const [key, nestedValue] of Object.entries(value as Record<string, unknown>)) {
    const currentPath = `${path}.${key}`;
    if (forbiddenDialerDryRunKeys.has(key)) {
      return currentPath;
    }
    const nested = findForbiddenDialerDryRunPayloadKey(nestedValue, currentPath);
    if (nested) return nested;
  }

  return undefined;
}
