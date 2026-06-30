# CEDCO R02 Remaining Blockers

R02 is usable for synthetic platform operations, but these blockers remain before a live pilot:

- External inbound number connection is not approved.
- External calendar OAuth credentials are not approved.
- PBX real routing is not connected.
- Transcript/audio remain NO-GO.
- Provider egress for additional calls remains NO-GO.
- Public/provider webhook calls require separate controlled approval.
- Manual transcription of demo audio remains required because no approved local transcriber is
  installed.

Next approval gates:

- `APPROVE_TWILIO_INBOUND_NUMBER_CONNECTION`
- `APPROVE_GOOGLE_CALENDAR_OAUTH_STAGING`
- `APPROVE_SINGLE_CONTROLLED_WEBHOOK_METADATA_CALL`
