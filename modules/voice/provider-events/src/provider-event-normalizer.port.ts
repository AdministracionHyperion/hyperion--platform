import type { DomainError, Result } from "../../../../packages/shared/src/core";
import type { ProviderEventEnvelope } from "./provider-event-envelope";
import type { SanitizedProviderEvent } from "./sanitized-provider-event";

export interface ProviderEventNormalizerPort {
  normalize(event: ProviderEventEnvelope): Result<SanitizedProviderEvent, DomainError>;
}
