import {
  metricNames,
  sanitizeLogMetadata,
  type LoggerPort,
  type MetricsRegistryPort,
} from "../../../../../packages/observability/src";
import {
  fail,
  ok,
  sanitizeMetadata,
  type DomainError,
  type OperationContext,
  type Result,
} from "../../../../../packages/shared/src/core";
import { createProviderEventId } from "../provider-event-id";
import type { ProviderEventEnvelope } from "../provider-event-envelope";
import type { ProviderEventNormalizerPort } from "../provider-event-normalizer.port";
import type { ProviderEventResult } from "../provider-event-result";
import type { ProviderEventSource } from "../provider-event-source";
import type { ProviderEventType } from "../provider-event-type";
import type { ProviderEventSignatureVerifierPort } from "../provider-event-signature-verifier.port";
import type { ReplayProtectionPort } from "../replay-protection.port";
import { evaluateProviderEventPolicy } from "../provider-event-policy";
import { providerEventConflictError, providerEventValidationError } from "../provider-event-error";
import { sanitizeProviderEventPayload } from "../post-call-event-sanitizer";
import { processSanitizedProviderEvent } from "./process-sanitized-provider-event";

export interface ProviderEventAuditPort {
  record(event: {
    readonly tenantId: string;
    readonly actorId?: string;
    readonly correlationId: string;
    readonly action: string;
    readonly resourceType: string;
    readonly resourceId: string;
    readonly result: "success" | "failure";
    readonly metadata?: Readonly<Record<string, unknown>>;
    readonly occurredAt: Date;
  }): Promise<void>;
}

export interface IngestProviderEventInput {
  readonly context: OperationContext;
  readonly source: ProviderEventSource;
  readonly type: ProviderEventType;
  readonly eventId: string;
  readonly providerCallRef: string;
  readonly occurredAt: Date;
  readonly headers: Readonly<Record<string, unknown>>;
  readonly payload: Readonly<Record<string, unknown>>;
  readonly metadata?: Readonly<Record<string, unknown>>;
  readonly normalizer: ProviderEventNormalizerPort;
  readonly signatureVerifier: ProviderEventSignatureVerifierPort;
  readonly replayProtection: ReplayProtectionPort;
  readonly replayTtlMs?: number;
  readonly logger?: LoggerPort;
  readonly metrics?: MetricsRegistryPort;
  readonly audit?: ProviderEventAuditPort;
}

export async function ingestProviderEvent(
  input: IngestProviderEventInput,
): Promise<Result<ProviderEventResult, DomainError>> {
  const startedAt = Date.now();
  input.metrics?.increment(metricNames.providerEventsReceivedTotal, { source: input.source });

  const eventId = createProviderEventId(input.eventId);
  if (!eventId.ok) {
    return reject(input, input.eventId, "provider.event.rejected", eventId.error);
  }

  const policy = evaluateProviderEventPolicy({
    source: input.source,
    type: input.type,
    tenantId: input.context.tenantId,
    correlationId: input.context.correlationId,
    providerCallRef: input.providerCallRef,
    payload: input.payload,
  });
  if (!policy.ok) {
    return reject(input, input.eventId, "provider.event.rejected", policy.error);
  }

  const signature = input.signatureVerifier.verify({
    headers: input.headers,
    eventId: input.eventId,
    payload: input.payload,
  });
  if (!signature.ok || !signature.value.verified) {
    return reject(
      input,
      input.eventId,
      "provider.event.signature_rejected",
      signature.ok
        ? providerEventValidationError(signature.value.reason ?? "signature invalid")
        : signature.error,
    );
  }
  input.metrics?.increment(metricNames.providerEventsVerifiedTotal, { source: input.source });

  const replayKey = `${input.source}:${input.eventId}`;
  if (input.replayProtection.hasSeen(replayKey)) {
    input.metrics?.increment(metricNames.providerEventsReplayBlockedTotal, {
      source: input.source,
    });
    await input.audit?.record({
      tenantId: input.context.tenantId,
      actorId: input.context.actorId,
      correlationId: input.context.correlationId,
      action: "provider.event.replay_blocked",
      resourceType: "provider_event",
      resourceId: input.eventId,
      result: "failure",
      metadata: { source: input.source, type: input.type },
      occurredAt: input.context.occurredAt,
    });
    return fail(providerEventConflictError("provider event replay was blocked"));
  }
  input.replayProtection.remember(replayKey, input.replayTtlMs ?? 300_000);

  const payload = sanitizeProviderEventPayload(input.payload);
  if (!payload.ok) {
    return reject(input, input.eventId, "provider.event.rejected", payload.error);
  }
  input.metrics?.increment(metricNames.providerEventsSanitizedTotal, { source: input.source });

  const envelope: ProviderEventEnvelope = {
    eventId: eventId.value,
    source: input.source,
    type: input.type,
    tenantId: input.context.tenantId,
    correlationId: input.context.correlationId,
    providerCallRef: input.providerCallRef,
    occurredAt: input.occurredAt,
    receivedAt: new Date(),
    headers: sanitizeMetadata(input.headers),
    payload: payload.value,
    signatureVerification: { required: true, verified: true },
    replayKey,
    metadata: sanitizeMetadata(input.metadata),
  };

  const normalized = input.normalizer.normalize(envelope);
  if (!normalized.ok) {
    return reject(input, input.eventId, "provider.event.rejected", normalized.error);
  }

  const processed = processSanitizedProviderEvent({
    event: normalized.value,
    logger: input.logger,
    metrics: input.metrics,
  });
  if (!processed.ok) {
    return reject(input, input.eventId, "provider.event.failed", processed.error);
  }

  input.metrics?.observe(metricNames.providerEventProcessingDurationMs, Date.now() - startedAt, {
    source: input.source,
  });
  await input.audit?.record({
    tenantId: input.context.tenantId,
    actorId: input.context.actorId,
    correlationId: input.context.correlationId,
    action: "provider.event.processed",
    resourceType: "provider_event",
    resourceId: input.eventId,
    result: "success",
    metadata: {
      source: input.source,
      type: input.type,
      providerCallRef: input.providerCallRef,
    },
    occurredAt: input.context.occurredAt,
  });

  return ok(processed.value);
}

async function reject(
  input: IngestProviderEventInput,
  eventId: string,
  action: string,
  error: DomainError,
): Promise<Result<ProviderEventResult, DomainError>> {
  input.metrics?.increment(metricNames.providerEventsRejectedTotal, { source: input.source });
  input.logger?.warn({
    message: action,
    eventName: action,
    tenantId: input.context.tenantId,
    actorId: input.context.actorId,
    correlationId: input.context.correlationId,
    metadata: sanitizeLogMetadata({
      eventId,
      source: input.source,
      type: input.type,
      errorCode: error.code,
    }),
  });
  await input.audit?.record({
    tenantId: input.context.tenantId,
    actorId: input.context.actorId,
    correlationId: input.context.correlationId,
    action,
    resourceType: "provider_event",
    resourceId: eventId,
    result: "failure",
    metadata: { source: input.source, type: input.type, errorCode: error.code },
    occurredAt: input.context.occurredAt,
  });
  return fail(error);
}
