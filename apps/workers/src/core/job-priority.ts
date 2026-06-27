export const jobPriorities = ["low", "normal", "high", "critical"] as const;

export type JobPriority = (typeof jobPriorities)[number];
