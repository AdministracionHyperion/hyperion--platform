# Runtime Blockers

Runtime blockers prevent sensitive behavior from being enabled accidentally through API payloads.

## Blocked By Default

- Real calls.
- Provider egress.
- Production deploy.
- Worker runtime.
- Raw transcript.
- Raw recording and audio URLs.
- Data export.
- CEDCO D02 real calls.
- CEDCO D02 scheduling integration.
- CEDCO D02 eligibility integration.

## Sensitive Payload Fields

Payload fields such as `phoneNumber`, `to_number`, `from_number`, `rawTranscript`, `transcript`,
`audioUrl`, `recordingUrl`, `apiKey`, `token`, `secret` and `password` are rejected before route
logic runs.

## Future Enablement

Future enablement requires explicit flags, RBAC, human approval references, runbook references,
provider configuration references, secret manager references, audit logs and CI evidence. This loop
does not enable any real runtime.
