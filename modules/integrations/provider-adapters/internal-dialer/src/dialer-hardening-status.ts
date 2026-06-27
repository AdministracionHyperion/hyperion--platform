export interface DialerHardeningStatus {
  readonly idempotencyKeyPersisted: boolean;
  readonly dryRunSupported: boolean;
  readonly webhookSignatureRequired: boolean;
  readonly authJwtRequired: boolean;
  readonly rawOutcomePersistenceRemoved: boolean;
  readonly internalEndpointAvailable: boolean;
  readonly pendingContactsAtomic: boolean;
  readonly retryDlqClarified: boolean;
  readonly p0Complete: boolean;
}

export const defaultDialerHardeningStatus: DialerHardeningStatus = {
  idempotencyKeyPersisted: false,
  dryRunSupported: false,
  webhookSignatureRequired: false,
  authJwtRequired: false,
  rawOutcomePersistenceRemoved: false,
  internalEndpointAvailable: false,
  pendingContactsAtomic: false,
  retryDlqClarified: false,
  p0Complete: false,
};

export function buildDialerHardeningStatus(
  input: Partial<Omit<DialerHardeningStatus, "p0Complete">> = {},
): DialerHardeningStatus {
  const status = { ...defaultDialerHardeningStatus, ...input };
  const p0Complete =
    status.idempotencyKeyPersisted &&
    status.dryRunSupported &&
    status.webhookSignatureRequired &&
    status.authJwtRequired &&
    status.rawOutcomePersistenceRemoved &&
    status.internalEndpointAvailable &&
    status.pendingContactsAtomic &&
    status.retryDlqClarified;

  return { ...status, p0Complete };
}
