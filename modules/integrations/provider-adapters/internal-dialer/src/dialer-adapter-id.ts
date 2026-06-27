export type DialerAdapterId = string;

export function createDialerAdapterId(value: string): DialerAdapterId {
  const normalized = value.trim();
  if (!/^[a-z0-9][a-z0-9-]{2,80}$/u.test(normalized)) {
    throw new Error("Invalid dialer adapter id.");
  }
  return normalized;
}
