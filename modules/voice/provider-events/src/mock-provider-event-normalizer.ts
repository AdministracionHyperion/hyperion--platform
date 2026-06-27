import { fail, ok, type DomainError, type Result } from "../../../../packages/shared/src/core";
import type { ProviderEventEnvelope } from "./provider-event-envelope";
import type { ProviderEventNormalizerPort } from "./provider-event-normalizer.port";
import { evaluateProviderEventPolicy } from "./provider-event-policy";
import { providerEventValidationError } from "./provider-event-error";
import { sanitizeProviderEventPayload } from "./post-call-event-sanitizer";
import type { SanitizedProviderEvent } from "./sanitized-provider-event";

export class MockProviderEventNormalizer implements ProviderEventNormalizerPort {
  normalize(event: ProviderEventEnvelope): Result<SanitizedProviderEvent, DomainError> {
    const policy = evaluateProviderEventPolicy({
      source: event.source,
      type: event.type,
      tenantId: event.tenantId,
      correlationId: event.correlationId,
      providerCallRef: event.providerCallRef,
      payload: event.payload,
    });
    if (!policy.ok) {
      return policy;
    }

    const sanitized = sanitizeProviderEventPayload(event.payload);
    if (!sanitized.ok) {
      return sanitized;
    }
    const metadata = sanitized.value;

    if (event.source !== "mock") {
      return fail(providerEventValidationError("sanitized provider events must be mock sourced"));
    }

    return ok({
      eventId: event.eventId,
      source: "mock",
      type: event.type,
      tenantId: event.tenantId,
      correlationId: event.correlationId,
      providerCallRef: event.providerCallRef,
      safeCallSessionRef: safeString(metadata.safeCallSessionRef) ?? event.providerCallRef,
      normalizedStatus: normalizeStatus(event.type),
      safeOutcome: safeString(metadata.disposition) ?? safeString(metadata.safeOutcome),
      safeSummary: safeString(metadata.safeSummary),
      safeIntent: safeString(metadata.safeIntent),
      handoffRecommended: metadata.handoffRecommended === true,
      postCallAvailable:
        event.type === "provider.mock.post_call.available" ||
        event.type === "provider.mock.call.completed",
      metadata,
    });
  }
}

function normalizeStatus(
  type: ProviderEventEnvelope["type"],
): SanitizedProviderEvent["normalizedStatus"] {
  switch (type) {
    case "provider.mock.call.started":
      return "started";
    case "provider.mock.call.ringing":
      return "ringing";
    case "provider.mock.call.answered":
      return "answered";
    case "provider.mock.call.intent_detected":
      return "intent_detected";
    case "provider.mock.call.completed":
      return "completed";
    case "provider.mock.call.failed":
      return "failed";
    case "provider.mock.post_call.available":
      return "post_call_available";
  }
}

function safeString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
}
