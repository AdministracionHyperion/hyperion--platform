# CEDCO D02 Eval Suite

The CEDCO D02 eval suite is a deterministic quality gate for the mock-only calls vertical. It
measures readiness, compliance, scheduling guidance, eligibility guidance, orientation, handoff,
unsafe payload blocking, clinical boundary handling, mock call runtime regressions and mock provider
event ingestion regressions.

The suite does not use a real LLM, voice provider, SIP trunk, phone number, external database,
network call or customer data. It runs with TypeScript fixtures and local assertions.

Run locally:

```powershell
pnpm test:evals
pnpm evals:cedco-d02
```

The suite blocks progress when it detects critical failures such as clinical diagnosis, clinical
triage, PII, raw transcript, raw audio, provider egress, real calls, out-of-scope products, provider
SDK imports or tracked private files.

This is not a production certification. It is a deterministic pre-runtime quality gate before future
provider adapters, smoke tests and production approvals.
