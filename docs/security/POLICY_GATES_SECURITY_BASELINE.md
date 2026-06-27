# Policy Gates Security Baseline

Policy gates block dangerous runtime actions before adapters, workers or production paths exist.

## Protected Actions

- `call.dispatch`
- `call.real_call.enable`
- `provider.egress`
- `provider.webhook.ingest`
- `production.deploy`
- `runtime.worker.start`
- `raw_transcript.enable`
- `raw_recording.enable`
- `data.export`
- `cedco.d02.real_calls.enable`
- `cedco.d02.scheduling.integration.enable`
- `cedco.d02.eligibility.integration.enable`
- `cedco.d02.production.ready`

## Default Flags

All runtime safety flags default to `false`. That means real calls, provider egress, production
deploy, raw transcript, raw recording, data export, worker runtime and CEDCO integrations are
blocked unless a future loop adds explicit approval flow, runbook references and secure
configuration.

## Required References

Dangerous actions require conceptual references such as approval, runbook, provider configuration
and secret manager refs. This loop validates the contract only; it does not create a real secret
manager or provider configuration.

## Audit And Metrics

Denied gates emit sanitized logs, metrics and audit failure records in protected API flows.
