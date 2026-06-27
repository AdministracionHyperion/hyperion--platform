import {
  metricNames,
  type LoggerPort,
  type MetricsRegistryPort,
} from "../../../../../../../packages/observability/src";
import {
  fail,
  ok,
  type DomainError,
  type Result,
} from "../../../../../../../packages/shared/src/core";
import type { SanitizedProviderEvent } from "../../../../../../voice/provider-events/src";
import {
  mapProviderEventToCedcoD02Outcome,
  type CedcoD02ProviderEventOutcome,
} from "./map-provider-event-to-cedco-d02-outcome";

export function processCedcoD02ProviderEvent(input: {
  readonly event: SanitizedProviderEvent;
  readonly logger?: LoggerPort;
  readonly metrics?: MetricsRegistryPort;
}): Result<CedcoD02ProviderEventOutcome, DomainError> {
  if (containsClinicalLanguage(input.event.safeSummary)) {
    return fail({
      code: "invalid_metadata",
      message: "CEDCO D02 provider event summary must not contain clinical diagnosis language",
    });
  }

  const outcome = mapProviderEventToCedcoD02Outcome(input.event);
  input.metrics?.increment(metricNames.cedcoD02PostCallEventsProcessedTotal, {
    type: input.event.type,
  });
  input.logger?.info({
    message: "cedco.d02.provider_event.processed",
    eventName: "cedco.d02.provider_event.processed",
    tenantId: input.event.tenantId,
    correlationId: input.event.correlationId,
    metadata: {
      eventId: input.event.eventId,
      providerCallRef: input.event.providerCallRef,
      disposition: outcome.disposition,
    },
  });
  return ok(outcome);
}

function containsClinicalLanguage(value: string | undefined): boolean {
  if (!value) {
    return false;
  }
  return /\bdiagn[oó]stico\b|\btriage\b|\bhistoria cl[ií]nica\b/iu.test(value);
}
