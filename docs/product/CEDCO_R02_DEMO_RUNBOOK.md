# CEDCO R02 Demo Runbook

Demo path:

1. Seed R02 demo state with `POST /api/v1/tenants/:tenantId/r02/demo/seed`.
2. Create availability with `POST /r02/calendar/availability`.
3. Upload a TXT/MD/CSV/JSON knowledge document.
4. Process, approve and activate the document.
5. Create or activate the CEDCO R02 agent version.
6. Run `POST /r02/agent-flow/simulate` for a scheduling intent.
7. Confirm the appointment appears in `GET /r02/appointments`.
8. Confirm external calendar sync-test reports disabled/no credentials.
9. Review `GET /r02/audit`.

Do not use this runbook to connect real Twilio, Google Calendar, PBX or ElevenLabs. Those require
separate explicit gates.
