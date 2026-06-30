# CEDCO D02 Provider Webhook Readiness

## D02-AUTO-19 Decision

Real provider metadata-only webhook staging remains NO-GO.

Provider capability discovery found that safe private staging is not confirmed: provider callbacks
require a reachable webhook URL, agent-level-only scope is not proven, and metadata-only delivery
without transcript/audio risk is not proven.

## Platform Boundary

Platform must not assume that a real ElevenLabs webhook is connected. The only validated runtime is
the dialer private synthetic endpoint on loopback/internal staging. Platform may consume sanitized
metadata-only status in a future approved integration, but must not store, render, or forward:

- transcript text;
- audio or audio URLs;
- raw provider payloads;
- phone numbers or DDI values;
- provider IDs;
- API keys, webhook secrets, or SIP credentials.

## D02-AUTO-21A Update

Public staging exposure is now active through Traefik for synthetic signed payloads only. This
changes only the staging ingress readiness boundary; real ElevenLabs webhook registration remains
NO-GO.

## Current State

| Control                            | State                                      |
| ---------------------------------- | ------------------------------------------ |
| Private synthetic webhook endpoint | Validated on VM                            |
| Public exposure blueprint          | Implemented for synthetic staging          |
| Real provider webhook              | Not connected                              |
| Public webhook                     | Exposed for synthetic signed payloads only |
| Provider config attempted          | No                                         |
| API key used                       | No                                         |
| Transcript/audio accessed          | No                                         |
| Provider egress                    | Disabled                                   |
| Live calls                         | Disabled                                   |

## Next Gate

Real provider webhook metadata-only processing requires a later loop:

`APPROVE_REAL_PROVIDER_WEBHOOK_METADATA_ONLY`
