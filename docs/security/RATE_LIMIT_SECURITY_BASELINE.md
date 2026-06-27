# Rate Limit Security Baseline

Rate limits are implemented in-memory for API tests and early runtime blockers.

## Scopes

- tenant
- actor
- route
- tenant_actor
- tenant_route
- actor_route

Keys are composed from safe tenant, actor, method, route and rule values. They must not contain PII.

## Defaults

- Health/version: high public limit.
- Protected reads: 120 per minute by tenant and actor.
- Protected writes: 60 per minute by tenant and actor.
- Voice writes: 30 per minute by tenant and actor.
- CEDCO D02 evaluation routes: 60 per minute by tenant and actor.

## Limits

The store is in-memory and not distributed. It is suitable for local, CI and pre-runtime safety. A
future production loop must replace it with a reviewed distributed store such as Redis only after
the worker/runtime architecture is approved.
