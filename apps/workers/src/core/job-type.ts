export const jobTypes = [
  "outbox.process",
  "voice.call.prepare",
  "voice.call.event.process",
  "voice.post_call.process",
  "voice.call.mock_session.run",
  "voice.call.mock_session.finalize",
  "cedco_d02.readiness.evaluate",
  "cedco_d02.compliance.evaluate",
  "cedco_d02.metric.record",
  "cedco_d02.mock_flow.run",
] as const;

export type JobType = (typeof jobTypes)[number];

export function isJobType(value: string): value is JobType {
  return jobTypes.includes(value as JobType);
}
