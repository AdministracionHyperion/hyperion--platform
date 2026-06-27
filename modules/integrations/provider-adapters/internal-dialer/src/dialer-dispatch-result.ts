import type { SafeMetadata } from "../../../../../packages/shared/src/core";
import type { DialerBlockedReason } from "./dialer-blocked-reason";

export const dialerDispatchStatuses = [
  "blocked",
  "dry_run_accepted",
  "accepted_future",
  "failed",
] as const;

export type DialerDispatchStatus = (typeof dialerDispatchStatuses)[number];

export interface DialerDispatchResult {
  readonly internalCallId: string;
  readonly externalRequestId: string;
  readonly status: DialerDispatchStatus;
  readonly providerConversationRef?: string;
  readonly idempotencyKey: string;
  readonly blockedReasons: readonly DialerBlockedReason[];
  readonly auditRef?: string;
  readonly metadata: SafeMetadata;
}
