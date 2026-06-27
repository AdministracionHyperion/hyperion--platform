export const policyGateActions = [
  "call.dispatch",
  "call.real_call.enable",
  "provider.egress",
  "provider.webhook.ingest",
  "provider.mock_event.ingest",
  "voice.provider_event.process",
  "cedco.d02.post_call.process",
  "production.deploy",
  "runtime.worker.start",
  "raw_transcript.enable",
  "raw_recording.enable",
  "data.export",
  "cedco.d02.real_calls.enable",
  "cedco.d02.scheduling.integration.enable",
  "cedco.d02.eligibility.integration.enable",
  "cedco.d02.production.ready",
  "dialer.internal.dry_run",
  "dialer.internal.dispatch",
  "dialer.internal.status_read",
  "dialer.hardening.p0_required",
] as const;

export type PolicyGateAction = (typeof policyGateActions)[number];
