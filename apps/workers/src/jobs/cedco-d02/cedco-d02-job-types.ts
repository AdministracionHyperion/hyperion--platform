import type { JobType } from "../../core";

export const cedcoD02JobTypes = [
  "cedco_d02.readiness.evaluate",
  "cedco_d02.compliance.evaluate",
  "cedco_d02.metric.record",
] as const satisfies readonly JobType[];

export type CedcoD02JobType = (typeof cedcoD02JobTypes)[number];
