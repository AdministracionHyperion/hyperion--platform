import {
  defaultDialerHardeningStatus,
  type DialerHardeningStatus,
} from "../dialer-hardening-status";

export type DialerHardeningP0Key = Exclude<keyof DialerHardeningStatus, "p0Complete">;

export interface DialerHardeningChecklistItem {
  readonly id: DialerHardeningP0Key;
  readonly label: string;
  readonly complete: boolean;
  readonly severity: "p0";
}

const labels: Readonly<Record<DialerHardeningP0Key, string>> = {
  idempotencyKeyPersisted: "Idempotency key persisted",
  dryRunSupported: "Real dry-run supported by dialer",
  webhookSignatureRequired: "Webhook signature required in production",
  authJwtRequired: "AUTH_JWT_SECRET required in production",
  rawOutcomePersistenceRemoved: "Raw outcome persistence removed",
  internalEndpointAvailable: "Stable internal Hyperion endpoint available",
  pendingContactsAtomic: "Pending contacts atomically marked attempted",
  retryDlqClarified: "Retry/DLQ behavior active or removed from contract",
};

export function buildDialerHardeningChecklist(
  status: DialerHardeningStatus = defaultDialerHardeningStatus,
): readonly DialerHardeningChecklistItem[] {
  return (Object.keys(labels) as DialerHardeningP0Key[]).map((id) => ({
    id,
    label: labels[id],
    complete: status[id],
    severity: "p0",
  }));
}
