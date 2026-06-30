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

## Current State

| Control                            | State           |
| ---------------------------------- | --------------- |
| Private synthetic webhook endpoint | Validated on VM |
| Real provider webhook              | Not connected   |
| Public webhook                     | Not exposed     |
| Provider config attempted          | No              |
| API key used                       | No              |
| Transcript/audio accessed          | No              |
| Provider egress                    | Disabled        |
| Live calls                         | Disabled        |

## Next Gate

Public staging exposure requires a separate loop and this exact phrase:

`APPROVE_PUBLIC_WEBHOOK_STAGING_EXPOSURE`
