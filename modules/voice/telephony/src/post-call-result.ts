import { type SafeMetadata } from "../../../../packages/shared/src/core";
import type { CallId } from "../../voice-core/src/call-id";
import type { CallStatus } from "../../voice-core/src/call-status";

export interface PostCallResult {
  readonly callId: CallId;
  readonly status: CallStatus;
  readonly durationSeconds?: number;
  readonly redactedSummary?: string;
  readonly outcome?: string;
  readonly handoffRecommended?: boolean;
  readonly metadata: SafeMetadata;
}
