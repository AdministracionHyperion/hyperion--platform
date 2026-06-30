# CEDCO R02 Next Gates

Current state: staging demo is operational with synthetic data only.

Future gates:

- `APPROVE_TWILIO_INBOUND_NUMBER_CONNECTION`
- `APPROVE_GOOGLE_CALENDAR_OAUTH_STAGING`
- `APPROVE_SINGLE_CONTROLLED_WEBHOOK_METADATA_CALL`
- `APPROVE_PBX_STAGING_RUNTIME_REFACTOR`

Gate rules:

- Each gate requires a separate loop.
- No credentials are accepted through Git.
- No real calls are allowed without an explicit single-call approval.
- Transcript/audio remain NO-GO until a dedicated compliance approval exists.
- Provider egress and live calls remain false by default.
