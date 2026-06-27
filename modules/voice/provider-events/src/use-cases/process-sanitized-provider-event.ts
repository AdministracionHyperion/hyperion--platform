import {
  metricNames,
  type LoggerPort,
  type MetricsRegistryPort,
} from "../../../../../packages/observability/src";
import { ok, type DomainError, type Result } from "../../../../../packages/shared/src/core";
import type { SanitizedProviderEvent } from "../sanitized-provider-event";
import type { ProviderEventResult } from "../provider-event-result";

export function processSanitizedProviderEvent(input: {
  readonly event: SanitizedProviderEvent;
  readonly logger?: LoggerPort;
  readonly metrics?: MetricsRegistryPort;
}): Result<ProviderEventResult, DomainError> {
  input.metrics?.increment(metricNames.providerEventsProcessedTotal, {
    type: input.event.type,
  });
  input.logger?.info({
    message: "provider.event.processed",
    eventName: "provider.event.processed",
    tenantId: input.event.tenantId,
    correlationId: input.event.correlationId,
    metadata: {
      eventId: input.event.eventId,
      providerCallRef: input.event.providerCallRef,
      type: input.event.type,
    },
  });

  return ok({
    eventId: input.event.eventId,
    status: "processed",
    replayDetected: false,
    normalizedType: input.event.type,
    processed: true,
    safeSummary: input.event.safeSummary,
    event: input.event,
    auditRefs: [`provider-event-${input.event.eventId}`],
  });
}
