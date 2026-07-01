# CEDCO R02 Operational UI

Status: implemented as a safe operator-ready surface with the premium R02 voice cockpit UI.

The R02 page renders:

- Voice-assistant cockpit summary with local visual signal animation.
- Opt-in local interface sound feedback; no external audio, autoplay or media source.
- Calendar and appointment status.
- Availability slots.
- Knowledge base document status.
- Voice agent version status.
- Handoff targets.

The page also provides same-origin operator actions:

- Create internal availability.
- Create an internal appointment.
- Run Google Calendar sync dry-run for an internal appointment.
- Upload a RAG document from the dashboard.
- Load a local text-like RAG source into the dashboard form before upload.
- Submit operator-supplied extracted PDF/DOCX text through the API without storing the binary file.
- Process, approve and activate RAG content.
- Run keyword RAG search-test.
- Create an agent version.
- Approve and activate an agent version.
- Simulate schedule, knowledge and handoff flows.
- Store an internal handoff target reference.
- Read dynamic R02 readiness from tenant data.

Runtime boundaries:

- Real calls: disabled.
- Provider egress: disabled.
- External calendar credentials: not used.
- Google Calendar dry-run: enabled; no credentials, network calls or external mutation.
- External inbound provider: not connected.
- PBX real route: deferred outside the current R02 dashboard work.
- Transcript/audio: not accessed.
- Binary RAG file storage: disabled.
- Dashboard sounds: generated locally after user interaction only.

The UI intentionally does not include active controls for real calls, provider egress, production
deploy, transcript/audio access or external provider mutation. Handoff targets stored from the
dashboard are internal refs only; applying them to ElevenLabs remains a separate gated operation.
Customer-facing HTML intentionally avoids internal audit/preparation wording and named provider
labels; those remain in API evidence and gate docs only.

Staging:

- `GET /api/v1/tenants/:tenantId/r02/dashboard` renders the safe R02 dashboard HTML.
- The route was validated with tenant `cedco-demo`.
- The response contains no API keys, raw provider IDs, phone numbers, transcript payload or audio
  references.
- Local RAG file reading is browser-side only for `txt`, `md`, `csv` and `json`; PDF/DOCX binaries
  are not selected by the dashboard reader.
- The stylesheet includes `prefers-reduced-motion` handling for the animated signal UI.
- `GET /api/v1/tenants/:tenantId/r02/readiness` returns the same readiness boundary as JSON for
  operator checks and release evidence.
