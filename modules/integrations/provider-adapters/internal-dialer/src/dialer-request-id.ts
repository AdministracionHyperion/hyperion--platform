export type DialerRequestId = string;

export function createDialerRequestId(value: string): DialerRequestId {
  const normalized = value.trim();
  if (!/^[a-z0-9][a-z0-9-]{5,120}$/u.test(normalized)) {
    throw new Error("Invalid dialer request id.");
  }
  return normalized;
}
