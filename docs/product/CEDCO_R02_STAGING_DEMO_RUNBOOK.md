# CEDCO R02 Staging Demo Runbook

Status: deployed to Contabo staging for synthetic demo data only.

Runtime:

- Platform API release: R02 staging validation branch.
- Tenant ref: `cedco-demo`.
- Auth mode: internal `header-dev` staging headers.
- External providers: disabled.
- Provider egress: false.
- Live calls: false.
- Transcript/audio: not accessed.

Validation command inside the staging API container:

```bash
node scripts/r02-staging-operational-validation.mjs
```

Expected marker:

```text
R02_STAGING_OPERATIONAL_VALIDATION_PASSED
```

The validation seeds demo data and checks:

- dashboard route loads;
- seed reports `storageMode=prisma` and is idempotent;
- availability can be created and listed;
- appointment create, reschedule and cancel work and are read back from persisted state;
- Google Calendar adapter remains disabled;
- demo RAG document can be uploaded, activated and searched;
- agent demo/version activation works;
- agent flow simulation creates an internal appointment intent;
- handoff simulation creates a safe handoff result;
- viewer write access is denied;
- tenant isolation holds.

No real Twilio, Google, PBX, ElevenLabs mutation, calls, transcript/audio or provider payloads are
used.
