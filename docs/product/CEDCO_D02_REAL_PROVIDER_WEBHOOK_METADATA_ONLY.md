# CEDCO D02 Real Provider Webhook Metadata-Only

## D02-AUTO-22 Decision

Real ElevenLabs provider webhook is connected with **limited metadata-only scope**.

The approved D02-AUTO-22 loop configured one HMAC webhook and attached it through the staging agent
override. The only enabled provider event is `call_initiation_failure`; transcript and audio events
remain disabled.

## Platform Boundary

| Control                  | State                                     |
| ------------------------ | ----------------------------------------- |
| Real provider webhook    | Connected for failure-event metadata only |
| Provider config mutation | Attempted and verified                    |
| Webhook secret in VM     | Created, VM-only                          |
| Real provider payload    | Not received                              |
| Transcript/audio         | Not accessed                              |
| Provider egress          | Disabled                                  |
| Live calls               | Disabled                                  |

## Product Implication

Platform may treat failure-event provider webhook delivery as staged, but must not infer pilot
approval. Successful post-call transcript delivery is not validated, transcript/audio are not
approved, and customer-facing calls remain blocked until a separate pilot gate.
