export const jobStatuses = [
  "queued",
  "running",
  "succeeded",
  "failed",
  "dead_lettered",
  "cancelled",
  "blocked",
] as const;

export type JobStatus = (typeof jobStatuses)[number];
