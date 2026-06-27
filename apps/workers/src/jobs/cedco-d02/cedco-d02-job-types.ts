import type { JobType } from "../../core";

export const cedcoD02JobTypes = [
  "cedco_d02.readiness.evaluate",
  "cedco_d02.compliance.evaluate",
  "cedco_d02.metric.record",
  "cedco_d02.mock_flow.run",
  "cedco_d02.post_call_event.process",
] as const satisfies readonly JobType[];

export type CedcoD02JobType = (typeof cedcoD02JobTypes)[number];
