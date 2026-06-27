import { fail, type DomainError, type Result } from "../../../../../../../packages/shared/src/core";
import {
  sanitizeProviderEventPayload,
  type SanitizedProviderEvent,
} from "../../../../../../voice/provider-events/src";
import type { CedcoD02ProviderEventOutcome } from "./map-provider-event-to-cedco-d02-outcome";
import { processCedcoD02ProviderEvent } from "./process-cedco-d02-provider-event";

export function processCedcoD02PostCallEvent(input: {
  readonly event: SanitizedProviderEvent;
}): Result<CedcoD02ProviderEventOutcome, DomainError> {
  const sanitized = sanitizeProviderEventPayload(input.event.metadata);
  if (!sanitized.ok) {
    return fail(sanitized.error);
  }

  return processCedcoD02ProviderEvent({ event: input.event });
}
