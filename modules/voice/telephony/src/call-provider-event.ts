import { type SafeMetadata } from "../../../../packages/shared/src/core";
import type { CallId } from "../../voice-core/src/call-id";
import type { CallProviderEventType } from "./call-provider-event-type";
import type { ProviderCallReference } from "./provider-call-reference";
import type { ProviderCallStatus } from "./provider-call-status";

export interface CallProviderEvent {
  readonly providerName: string;
  readonly providerEventId: string;
  readonly callId?: CallId;
  readonly providerCallReference?: ProviderCallReference;
  readonly type: CallProviderEventType;
  readonly status?: ProviderCallStatus;
  readonly metadata: SafeMetadata;
  readonly occurredAt: Date;
}
