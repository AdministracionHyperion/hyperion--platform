export const callRuntimeStatuses = [
  "pending",
  "ready",
  "running",
  "completed",
  "failed",
  "blocked",
  "cancelled",
] as const;

export type CallRuntimeStatus = (typeof callRuntimeStatuses)[number];
