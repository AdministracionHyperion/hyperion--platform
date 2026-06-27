import { sanitizeMetadata, type OperationContext } from "../../../../../packages/shared/src/core";
import type { CallEventRepositoryPort } from "../../../voice-core/src/call-event-repository.port";
import { registerCallEvent } from "../../../voice-core/src/use-cases/register-call-event";
import type { CallProviderEvent } from "../call-provider-event";
import type { ProviderEventIngestionPort } from "../provider-event-ingestion.port";

export interface IngestProviderCallEventInput {
  readonly context: OperationContext;
  readonly event: CallProviderEvent;
  readonly eventRepository?: CallEventRepositoryPort;
  readonly ingestionPort?: ProviderEventIngestionPort;
}

export async function ingestProviderCallEvent(
  input: IngestProviderCallEventInput,
): Promise<CallProviderEvent> {
  const sanitized: CallProviderEvent = {
    ...input.event,
    metadata: sanitizeMetadata(input.event.metadata),
  };

  if (input.ingestionPort) {
    await input.ingestionPort.ingest(sanitized);
  }

  if (input.eventRepository && sanitized.callId) {
    await registerCallEvent({
      context: input.context,
      repository: input.eventRepository,
      callId: sanitized.callId,
      type: "call.provider_event_ingested",
      metadata: sanitized.metadata,
    });
  }

  return sanitized;
}
