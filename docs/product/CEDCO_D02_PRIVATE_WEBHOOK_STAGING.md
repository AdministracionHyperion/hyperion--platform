# CEDCO D02 Private Webhook Staging

D02-AUTO-17 introduces a private dialer-side staging endpoint for synthetic post-call webhook
validation. Platform treats this as a boundary contract only; no platform runtime endpoint is
enabled by this document.

## Current State

| Control                    | State                 |
| -------------------------- | --------------------- |
| Private synthetic endpoint | Implemented in dialer |
| VM loopback validation     | Passed                |
| Public provider webhook    | Not exposed           |
| Real provider webhook      | Not connected         |
| Provider capability review | Completed             |
| Provider egress            | Disabled              |
| Live calls                 | Disabled              |
| Transcript/audio           | Not accessed          |
| Real provider payloads     | Not processed         |

## Platform Boundary

Platform may rely on sanitized metadata-only post-call status in a future approved integration, but
must not store or render raw provider payloads, transcript text, audio references, phone numbers,
DDI values, provider IDs, API keys, SIP credentials, or webhook signing material.

The private endpoint accepts only synthetic signed payloads and is limited to staging/test mode.
D02-AUTO-18B validated it on the Contabo staging VM through loopback/internal access. It does not
authorize a public route, provider callback configuration, transcript QA, audio capture, or pilot
traffic.

D02-AUTO-19 reviewed real provider webhook readiness and kept provider webhook staging NO-GO.
Provider callbacks require a reachable URL, agent-level-only scope is unconfirmed, and metadata-only
filtering without transcript/audio risk is unconfirmed.

## Required Future Gates

Public staging exposure requires:

`APPROVE_PUBLIC_WEBHOOK_STAGING_EXPOSURE`

Private metadata-only provider webhook staging requires:

`APPROVE_PRIVATE_METADATA_ONLY_PROVIDER_WEBHOOK_STAGING`

Pilot calls require a separate pilot window approval with allowed numbers, rate limits, operator,
stop owner, and rollback owner.
