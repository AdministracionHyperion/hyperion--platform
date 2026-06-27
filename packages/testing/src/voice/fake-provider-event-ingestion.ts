import type { CallProviderEvent } from "../../../../modules/voice/telephony/src/call-provider-event";
import type { ProviderEventIngestionPort } from "../../../../modules/voice/telephony/src/provider-event-ingestion.port";

export class FakeProviderEventIngestion implements ProviderEventIngestionPort {
  readonly events: CallProviderEvent[] = [];

  async ingest(event: CallProviderEvent): Promise<void> {
    this.events.push(event);
  }
}
