import { type SafeMetadata } from "../../../../packages/shared/src/core";
import type { CallId } from "../../voice-core/src/call-id";
import type { ProviderCallReference } from "./provider-call-reference";

export interface PostCallWebhookEnvelope {
  readonly providerName: string;
  readonly providerEventId: string;
  readonly providerCallReference: ProviderCallReference;
  readonly callId?: CallId;
  readonly receivedAt: Date;
  readonly signatureVerified: boolean;
  readonly payloadMetadata: SafeMetadata;
}
