import type { SafeMetadata } from "../../../../packages/shared/src/core";
import type { ProviderEventId } from "./provider-event-id";
import type { ProviderEventSource } from "./provider-event-source";
import type { ProviderEventType } from "./provider-event-type";

export interface ProviderEventEnvelope {
  readonly eventId: ProviderEventId;
  readonly source: ProviderEventSource;
  readonly type: ProviderEventType;
  readonly tenantId: string;
  readonly correlationId: string;
  readonly providerCallRef: string;
  readonly occurredAt: Date;
  readonly receivedAt: Date;
  readonly headers: SafeMetadata;
  readonly payload: SafeMetadata;
  readonly signatureVerification: ProviderEventSignatureVerification;
  readonly replayKey: string;
  readonly metadata: SafeMetadata;
}

export interface ProviderEventSignatureVerification {
  readonly required: boolean;
  readonly verified: boolean;
  readonly reason?: string;
}

export interface CreateProviderEventEnvelopeInput {
  readonly eventId: string;
  readonly source: ProviderEventSource;
  readonly type: ProviderEventType;
  readonly tenantId: string;
  readonly correlationId: string;
  readonly providerCallRef: string;
  readonly occurredAt: Date;
  readonly receivedAt?: Date;
  readonly headers?: Readonly<Record<string, unknown>>;
  readonly payload?: Readonly<Record<string, unknown>>;
  readonly signatureVerification?: ProviderEventSignatureVerification;
  readonly replayKey?: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}
