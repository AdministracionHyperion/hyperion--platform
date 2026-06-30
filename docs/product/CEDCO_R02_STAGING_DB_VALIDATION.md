# CEDCO R02 Staging DB Validation

Validation command:

```bash
node scripts/r02-staging-operational-validation.mjs
```

Required marker:

```text
R02_STAGING_OPERATIONAL_VALIDATION_PASSED
```

The validation must confirm:

- dashboard route loads;
- seed response reports `storageMode=prisma`;
- seed is idempotent;
- availability is listed from persisted slots;
- appointment create is readable after write;
- appointment reschedule is readable after write;
- appointment cancel is readable after write;
- Google adapter remains disabled;
- RAG document can be processed, approved, activated and searched;
- RAG search returns source/version references;
- agent version can be activated;
- agent flow simulation creates a safe internal appointment;
- handoff simulation uses a stored safe target;
- audit events are persisted;
- viewer writes are denied;
- tenant isolation holds.

Validation must not use real provider payloads, numbers, secrets, transcript or audio.
