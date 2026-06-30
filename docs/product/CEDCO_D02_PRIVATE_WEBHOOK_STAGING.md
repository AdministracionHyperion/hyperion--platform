# CEDCO D02 Private Webhook Staging

D02-AUTO-17 introduces a private dialer-side staging endpoint for synthetic post-call webhook
validation. Platform treats this as a boundary contract only; no platform runtime endpoint is
enabled by this document.

## Current State

| Control                    | State                       |
| -------------------------- | --------------------------- |
| Private synthetic endpoint | Implemented in dialer       |
| VM loopback validation     | Passed                      |
| Public provider webhook    | Exposed for staging route   |
| Real provider webhook      | Failure-event metadata only |
| Provider capability review | Completed                   |
| Provider egress            | Disabled                    |
| Live calls                 | Disabled                    |
| Transcript/audio           | Not accessed                |
| Real provider payloads     | Not processed               |

## Platform Boundary

Platform may rely on sanitized metadata-only post-call status in a future approved integration, but
must not store or render raw provider payloads, transcript text, audio references, phone numbers,
DDI values, provider IDs, API keys, SIP credentials, or webhook signing material.

The private endpoint accepts only synthetic signed payloads and is limited to staging/test mode.
D02-AUTO-18B validated it on the Contabo staging VM through loopback/internal access. It does not
authorize a public route, provider callback configuration, transcript QA, audio capture, or pilot
traffic.

D02-AUTO-22 connected one real provider webhook through the staging agent override for
`call_initiation_failure` only. This does not authorize transcript/audio handling, successful
post-call transcript delivery, provider egress, live calls, or pilot traffic.

## Required Future Gates

Public staging exposure requires:

`APPROVE_PUBLIC_WEBHOOK_STAGING_EXPOSURE`

Pilot calls require a separate pilot window approval with allowed numbers, rate limits, operator,
stop owner, and rollback owner.
