import type { CallProviderEvent } from "./call-provider-event";

export interface ProviderEventIngestionPort {
  ingest(event: CallProviderEvent): Promise<void>;
}
