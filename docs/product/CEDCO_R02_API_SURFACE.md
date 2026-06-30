# CEDCO R02 API Surface

Implemented tenant-scoped API surface:

- `GET /api/v1/tenants/:tenantId/r02/dashboard`
- `POST /api/v1/tenants/:tenantId/r02/demo/seed`
- `GET /api/v1/tenants/:tenantId/r02/calendar/availability`
- `POST /api/v1/tenants/:tenantId/r02/calendar/availability`
- `GET /api/v1/tenants/:tenantId/r02/appointments`
- `POST /api/v1/tenants/:tenantId/r02/appointments`
- `POST /api/v1/tenants/:tenantId/r02/appointments/:id/cancel`
- `POST /api/v1/tenants/:tenantId/r02/appointments/:id/reschedule`
- `POST /api/v1/tenants/:tenantId/r02/google-calendar/:id/sync-test`
- `POST /api/v1/tenants/:tenantId/r02/knowledge-bases`
- `GET /api/v1/tenants/:tenantId/r02/knowledge-bases`
- `POST /api/v1/tenants/:tenantId/r02/knowledge-documents/upload`
- `GET /api/v1/tenants/:tenantId/r02/knowledge-documents`
- `POST /api/v1/tenants/:tenantId/r02/knowledge-documents/:id/process`
- `POST /api/v1/tenants/:tenantId/r02/knowledge-documents/:id/approve`
- `POST /api/v1/tenants/:tenantId/r02/knowledge-documents/:id/activate`
- `POST /api/v1/tenants/:tenantId/r02/knowledge/search-test`
- `POST /api/v1/tenants/:tenantId/r02/agents`
- `GET /api/v1/tenants/:tenantId/r02/agents`
- `POST /api/v1/tenants/:tenantId/r02/agents/:id/versions`
- `POST /api/v1/tenants/:tenantId/r02/agents/:id/approve`
- `POST /api/v1/tenants/:tenantId/r02/agents/:id/activate`
- `POST /api/v1/tenants/:tenantId/r02/agent-flow/simulate`
- `GET /api/v1/tenants/:tenantId/r02/handoff-targets`
- `POST /api/v1/tenants/:tenantId/r02/handoff-targets`
- `GET /api/v1/tenants/:tenantId/r02/audit`

Safety:

- Contracts reject forbidden payload fields before route handling.
- Accepted fields use safe references, never real numbers or provider identifiers.
- External calendar sync-test stays disabled and returns a safe status.
- Agent flow simulation does not call providers or access transcript/audio.
- RAG upload accepts `txt`, `md`, `csv`, `json`, plus PDF/DOCX source names when the request body
  contains operator-supplied extracted text. Binary PDF/DOCX content is not accepted or stored.
- RAG search uses keyword retrieval only; no external embeddings are used.
- Dashboard handoff target writes are internal refs only and set `realProviderMutation=false`.

Staging validation:

- `scripts/r02-staging-operational-validation.mjs` seeds synthetic CEDCO data and exercises the
  operational API surface against the staging API.
- The seed response must include `storageMode=prisma`.
- Appointment create, reschedule and cancel are read back after each write.
- The script must print `R02_STAGING_OPERATIONAL_VALIDATION_PASSED`.
