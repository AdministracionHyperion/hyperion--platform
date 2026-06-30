# CEDCO D02 Stop Procedure

This procedure keeps platform behavior conservative after the D02 Spanish validation call. It is a
product and operations boundary, not a runtime switch implementation.

## Kill Switch State

The platform keeps provider egress and live calls disabled. If a future pilot is approved, the pilot
must still have a verified stop path before any call is placed.

For public webhook staging, the kill switch must disable the Traefik public route, keep real
provider webhook processing disconnected until separately approved, keep transcript/audio disabled,
and confirm provider egress and live calls remain disabled.

D02-AUTO-22 did not connect the real provider webhook. Current stop posture remains synthetic-only
public route plus disabled provider egress/live calls.

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
3. Keep public webhook synthetic-only unless the route is being disabled.
4. Disable the Traefik public route if public webhook behavior is unsafe.
5. Preserve only private raw evidence in local private storage if it already exists.
6. Record sanitized status only.
7. Run platform-to-dialer and staging health checks before resuming any gate.

## Rollback Boundary

Rollback for this phase means returning to metadata-only evidence and no further provider calls. It
does not require firewall, Nginx, VM service restart, or provider resource deletion.
