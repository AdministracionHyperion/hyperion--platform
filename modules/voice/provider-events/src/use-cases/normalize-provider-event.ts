import type { DomainError, Result } from "../../../../../packages/shared/src/core";
import type { ProviderEventEnvelope } from "../provider-event-envelope";
import type { ProviderEventNormalizerPort } from "../provider-event-normalizer.port";
import type { SanitizedProviderEvent } from "../sanitized-provider-event";

export function normalizeProviderEvent(input: {
  readonly envelope: ProviderEventEnvelope;
  readonly normalizer: ProviderEventNormalizerPort;
}): Result<SanitizedProviderEvent, DomainError> {
  return input.normalizer.normalize(input.envelope);
}
