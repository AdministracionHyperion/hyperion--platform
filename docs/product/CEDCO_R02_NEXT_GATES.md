# CEDCO R02 Next Gates

Current state: staging demo is operational with synthetic data only and `local-staging` operator
auth is the intended staging boundary.

R02 operational persistence state:

- Calendar, appointments, RAG, agents, handoff targets and R02 audit are Prisma-backed in staging.
- Header-dev auth is local/test only and requires `ALLOW_HEADER_DEV_AUTH=true`.
- Local staging auth is Prisma-backed through users, memberships and sessions.
- External providers remain disabled for calls.
- The ElevenLabs CEDCO R02 agent configuration is complete.
- The exact Twilio Colombia phone number is imported and bound in ElevenLabs.
- One single controlled inbound call answered with the expected Spanish CEDCO R02 agent behavior.

Future gates:

- `APPROVE_SINGLE_CONTROLLED_R02_INBOUND_FUNCTIONAL_CALL`
- `APPROVE_TWILIO_INBOUND_NUMBER_OPERATIONAL_PILOT`
- `APPROVE_GOOGLE_CALENDAR_OAUTH_STAGING`
- `APPROVE_SINGLE_CONTROLLED_WEBHOOK_METADATA_CALL`
- `APPROVE_PBX_STAGING_RUNTIME_REFACTOR`
- `APPROVE_TRANSCRIPT_QA_FOR_CONTROLLED_PILOT`

Gate rules:

- Each gate requires a separate loop.
- No credentials are accepted through Git.
- No additional real calls are allowed without an explicit single-call approval.
- Transcript/audio remain NO-GO until a dedicated compliance approval exists.
- Provider egress and live calls remain false by default.
