# CEDCO R02 Operational UI

Status: implemented as a safe operator-ready surface.

The R02 page renders:

- Calendar and appointment status.
- Availability slots.
- Knowledge base document status.
- Voice agent version status.
- Handoff targets.
- Integration status.
- Audit count.

The page also provides same-origin operator actions:

- Seed demo data.
- Create internal availability.
- Create an internal appointment.
- Upload a RAG document from the dashboard.
- Process, approve and activate RAG content.
- Run keyword RAG search-test.
- Create an agent version.
- Approve and activate an agent version.
- Simulate schedule, knowledge and handoff flows.
- Store an internal handoff target reference.

Runtime boundaries:

- Real calls: disabled.
- Provider egress: disabled.
- External calendar credentials: not used.
- External inbound provider: not connected.
- PBX real route: not connected.
- Transcript/audio: not accessed.

The UI intentionally does not include active controls for real calls, provider egress, production
deploy, transcript/audio access or external provider mutation. Handoff targets stored from the
dashboard are internal refs only; applying them to ElevenLabs remains a separate gated operation.

Staging:

- `GET /api/v1/tenants/:tenantId/r02/dashboard` renders the safe R02 dashboard HTML.
- The route was validated with tenant `cedco-demo`.
- The response contains no API keys, raw provider IDs, phone numbers, transcript payload or audio
  references.
