# CEDCO D02 Provider Webhook Readiness

## D02-AUTO-19 Decision

Real provider metadata-only webhook staging was NO-GO in D02-AUTO-19.

Provider capability discovery found that safe private staging is not confirmed: provider callbacks
require a reachable webhook URL, agent-level-only scope is not proven, and metadata-only delivery
without transcript/audio risk is not proven.

## Platform Boundary

Platform may assume only failure-event provider metadata is staged after D02-AUTO-22. Platform must
not assume successful post-call transcript delivery or pilot readiness. It must not store, render,
or forward:

- transcript text;
- audio or audio URLs;
- raw provider payloads;
- phone numbers or DDI values;
- provider IDs;
- API keys, webhook secrets, or SIP credentials.

## D02-AUTO-21A Update

Public staging exposure is active through Traefik. D02-AUTO-22 uses that route for the staging agent
failure-event provider webhook while keeping transcript/audio and pilot traffic blocked.

## D02-AUTO-22 Update

The exact real-provider webhook approval was received. D02-AUTO-22 created one real provider HMAC
webhook and attached it through the staging agent override with only the `call_initiation_failure`
event enabled. The webhook secret exists only on the VM. No real provider payload, transcript, or
audio was accessed.

## Current State

| Control                            | State                                     |
| ---------------------------------- | ----------------------------------------- |
| Private synthetic webhook endpoint | Validated on VM                           |
| Public exposure blueprint          | Implemented for synthetic staging         |
| Real provider webhook              | Connected for failure-event metadata only |
| Public webhook                     | Exposed for signed staging payloads       |
| Provider config attempted          | Yes                                       |
| API key used                       | In memory only                            |
| Transcript/audio accessed          | No                                        |
| Provider egress                    | Disabled                                  |
| Live calls                         | Disabled                                  |

## Next Gate

Next work should focus on durable metadata-only event handling, rollback ownership, and pilot
readiness. Transcript QA, audio access, provider egress, live calls, and pilot calls still require
separate approval.

## D02-AUTO-23 Update

Durable metadata-only handling for `call_initiation_failure` is now implemented and validated with
synthetic signed payloads. The dialer persists only sanitized metadata and hashes, rejects/replays
idempotent duplicates according to policy, and records an audit event.

This update does not approve pilot calls, transcript QA, audio access, raw provider payload
persistence, campaigns, batch calls, automatic retries, provider egress, or live dispatch.
