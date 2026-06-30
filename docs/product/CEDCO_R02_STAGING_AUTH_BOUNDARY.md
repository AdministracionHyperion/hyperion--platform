# CEDCO R02 Staging Auth Boundary

`local-staging` is the active staging auth boundary for R02.

## Allowed

- Prisma-backed local users.
- Prisma-backed tenant memberships.
- Opaque local sessions.
- HttpOnly cookie or bearer session for internal validation scripts.
- Temporary credentials generated only at runtime.

## Blocked

- Header-dev auth as staging default.
- Anonymous R02 access.
- Hardcoded demo credentials.
- Provider API keys.
- Twilio, ElevenLabs, Google, or PBX real connections.
- Transcript or audio access.

## Header Dev Exception

`header-dev` can run only when all are true:

- `AUTH_MODE=header-dev`.
- `ALLOW_HEADER_DEV_AUTH=true`.
- runtime is local development or test.

This exception is not the staging operator path.
