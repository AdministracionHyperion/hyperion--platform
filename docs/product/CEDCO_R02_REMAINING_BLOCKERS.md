# CEDCO R02 Remaining Blockers

R02 is usable in staging for operator-authenticated platform operations, dashboard RAG loading,
calendar/cita flows, agent simulation, and controlled inbound validation. These blockers remain
before an operational pilot:

- External calendar OAuth credentials are not approved.
- Persistent provider-side handoff target enablement is not approved.
- Operational Twilio inbound pilot traffic is not approved.
- PBX real routing is not connected.
- Transcript/audio remain NO-GO beyond the one approved redacted transcript QA pass.
- Provider egress for additional calls remains NO-GO by default.
- Public/provider webhook calls require separate controlled approval.
- Manual transcription of demo audio remains required because no approved local transcriber is
  installed.

Next approval gates:

- `APPROVE_TWILIO_INBOUND_NUMBER_OPERATIONAL_PILOT`
- `APPROVE_GOOGLE_CALENDAR_OAUTH_STAGING`
- `APPROVE_SINGLE_CONTROLLED_WEBHOOK_METADATA_CALL`
- `APPROVE_PROVIDER_HANDOFF_TARGET_PERSISTENT_ENABLEMENT`
- `APPROVE_PBX_STAGING_RUNTIME_REFACTOR`
- `APPROVE_TRANSCRIPT_QA_FOR_CONTROLLED_PILOT`
