# CEDCO R02 Next Gates

Current state: staging operator surface is operational with controlled/synthetic platform data.
`local-staging` remains the intended staging boundary, and `jwt-required` now validates signed RS256
JWTs when a public key or JWKS URL is configured.

R02 operational persistence state:

- Calendar, appointments, RAG, agents, handoff targets and R02 audit are Prisma-backed in staging.
- Header-dev auth is local/test only and requires `ALLOW_HEADER_DEV_AUTH=true`.
- Local staging auth is Prisma-backed through users, memberships and sessions.
- JWT-required auth no longer unlocks routes by headers; it requires a signed bearer token with
  tenant and role claims.
- External providers remain disabled for calls.
- The ElevenLabs CEDCO R02 agent configuration is complete.
- The exact Twilio Colombia phone number is imported and bound in ElevenLabs.
- One single controlled inbound call answered with the expected Spanish CEDCO R02 agent behavior.
- One single functional inbound appointment-flow call passed with warnings after redacted transcript
  QA.
- One controlled handoff/redirection call succeeded, and the temporary transfer tool was rolled back
  afterward.
- R02 dashboard now exposes internal operator actions for calendar, RAG upload, agent versioning,
  flow simulation and handoff refs.
- R02 dashboard now uses the premium voice-cockpit interface with local opt-in sound feedback,
  motion-reduction CSS, and no external media source.
- Google Calendar sync dry-run is operator-ready from API/UI and remains disabled for real OAuth
  until a separate gate is approved.
- R02 readiness is DB-backed from tenant appointments, availability, RAG, agents, handoff targets
  and audit events; provider gates remain pending/blocked separately.
- PBX remains deferred and should not be treated as part of the current R02 dashboard closeout.

Future gates:

- `APPROVE_TWILIO_INBOUND_NUMBER_OPERATIONAL_PILOT`
- `APPROVE_GOOGLE_CALENDAR_OAUTH_STAGING`
- `APPROVE_SINGLE_CONTROLLED_WEBHOOK_METADATA_CALL`
- `APPROVE_PBX_STAGING_RUNTIME_REFACTOR`
- `APPROVE_TRANSCRIPT_QA_FOR_CONTROLLED_PILOT`
- `APPROVE_PROVIDER_HANDOFF_TARGET_PERSISTENT_ENABLEMENT`

Gate rules:

- Each gate requires a separate loop.
- No credentials are accepted through Git.
- No additional real calls are allowed without an explicit single-call approval.
- Transcript/audio remain NO-GO until a dedicated compliance approval exists.
- Provider egress and live calls remain false by default.
