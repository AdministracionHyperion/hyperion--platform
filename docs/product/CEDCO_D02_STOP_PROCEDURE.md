# CEDCO D02 Stop Procedure

This procedure keeps platform behavior conservative after the D02 Spanish validation call. It is a
product and operations boundary, not a runtime switch implementation.

## Kill Switch State

The platform keeps provider egress and live calls disabled. If a future pilot is approved, the pilot
must still have a verified stop path before any call is placed.

For public webhook staging, the kill switch must disable the Traefik public route, keep real
provider webhook processing disconnected until separately approved, keep transcript/audio disabled,
and confirm provider egress and live calls remain disabled.

D02-AUTO-22 connected the real provider webhook only for the staging agent's
`call_initiation_failure` event. Current stop posture is to keep provider egress and live calls
disabled, keep transcript/audio disabled, and use provider webhook rollback if failure-event
callbacks behave unexpectedly.

## Stop Conditions

Stop the pilot immediately if any of the following occurs:

- a call reaches a non-authorized number;
- more than one call would be triggered by one operator action;
- retry or batch behavior appears;
- the agent speaks the wrong language;
- the consent or no-recording statement is missing when required;
- transcript or audio is exposed without approval;
- provider webhook payload cannot be sanitized;
- platform or dialer staging health fails;
- any secret, phone number or provider ID is about to be committed.

## Manual Stop Steps

1. Do not start another call.
2. Keep platform provider egress and live calls disabled.
3. Keep public webhook scoped to the approved staging path unless the route is being disabled.
4. Disable the Traefik public route if public webhook behavior is unsafe.
5. Disable the real provider webhook or remove the staging agent webhook override if provider
   callback behavior is unsafe.
6. Preserve only private raw evidence in local private storage if it already exists.
7. Record sanitized status only.
8. Run platform-to-dialer and staging health checks before resuming any gate.

## Rollback Boundary

Rollback for this phase means returning to metadata-only evidence and no further provider calls. It
does not require firewall or Nginx changes. Provider webhook rollback must be scoped to the single
D02 staging webhook and staging agent override.
