# CEDCO D02 Post-Call Policy

CEDCO D02 Spanish controlled MVP is validated from the dialer/provider loop, but the platform
remains metadata-only and mock-first until a future pilot gate is approved. This document records
the product boundary for post-call handling after validation.

## Current State

| Control                       | State                                    |
| ----------------------------- | ---------------------------------------- |
| Controlled Spanish voice path | Validated by sanitized provider evidence |
| Platform provider egress      | Disabled                                 |
| Platform live calls           | Disabled                                 |
| Public webhook                | Not enabled                              |
| Recording                     | Not enabled                              |
| Transcript access             | Not approved                             |
| Audio access                  | Not approved                             |
| Synthetic webhook rehearsal   | Passed in dialer; public webhook blocked |

## Metadata-Only Default

Platform post-call views and events may use only sanitized metadata:

- status;
- timestamps;
- duration;
- end reason;
- provider status class;
- call attempted/completed flags;
- answered/unknown flag.
- sanitized error class.

Platform artifacts, dashboards, audit exports and docs must not include:

- transcript text;
- audio links or audio bytes;
- provider raw payloads;
- conversation summaries or analysis;
- destination numbers;
- DDI values;
- provider IDs;
- API keys or SIP credentials.

## Future Transcript QA Gate

Transcript QA is blocked by default. It requires a future explicit approval phrase:

`APPROVE_TRANSCRIPT_QA_FOR_CONTROLLED_PILOT`

That gate must also define consent language, private storage, redaction, retention and sanitized
reporting rules before any transcript is viewed or processed.

## Future Audio Gate

Audio capture or review is blocked by default. It requires a future explicit approval phrase:

`APPROVE_AUDIO_CAPTURE_FOR_CONTROLLED_PILOT`

Audio must never be committed to GitHub. If future compliance approval allows audio, raw files must
remain in private storage only with a separate retention decision.

## Synthetic Webhook Rehearsal

D02-AUTO-16 validates signature, replay, idempotency and metadata-only sanitization with synthetic
fixtures in the dialer repo. This does not approve public webhook exposure or real provider payload
processing in platform.
