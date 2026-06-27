import type { JobType } from "../../core";

export const outboxJobTypes = ["outbox.process"] as const satisfies readonly JobType[];

export type OutboxJobType = (typeof outboxJobTypes)[number];
