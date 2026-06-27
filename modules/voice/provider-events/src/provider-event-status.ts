export const providerEventStatuses = [
  "received",
  "verified",
  "replay_blocked",
  "normalized",
  "sanitized",
  "processed",
  "rejected",
  "failed",
] as const;

export type ProviderEventStatus = (typeof providerEventStatuses)[number];
