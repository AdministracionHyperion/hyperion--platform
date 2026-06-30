# CEDCO R02 DB-Backed API Runbook

Use the tenant-scoped R02 API with staging header auth.

Required headers:

- `x-actor-id`
- `x-actor-roles`
- `x-correlation-id`

Operational checks:

1. Seed demo records with `POST /api/v1/tenants/:tenantId/r02/demo/seed`.
2. Confirm the response includes `storageMode=prisma` and `idempotent=true`.
3. Create availability with `POST /r02/calendar/availability`.
4. Create, reschedule and cancel an appointment.
5. Read appointments after every write.
6. Upload, process, approve and activate a knowledge document.
7. Search knowledge and confirm results include `documentId` and `versionId`.
8. Create, approve and activate an agent version.
9. Simulate a scheduling flow.
10. Read audit events.

Failure policy:

- Do not retry with real providers.
- Do not add credentials to runtime or Git.
- Keep Google, Twilio, PBX and ElevenLabs real integrations disabled.
- Treat transcript/audio as NO-GO.
