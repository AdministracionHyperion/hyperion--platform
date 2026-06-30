# CEDCO R02 Auth Hardening

R02 staging no longer depends on header-driven actor impersonation as the operational default. The
API now supports `AUTH_MODE=local-staging`, backed by Prisma users, tenant memberships, local
credentials, and opaque sessions.

## Runtime Model

- `header-dev` is allowed only for local development or tests when `ALLOW_HEADER_DEV_AUTH=true`.
- `local-staging` is the operator-ready staging mode.
- `jwt-required` remains the future OIDC/JWT mode and still requires an auth provider reference.
- Protected tenant routes require a valid local staging session through `Authorization: Bearer ...`
  or the `hyperion_session` HttpOnly cookie.
- `/api/v1/auth/login`, `/api/v1/auth/logout`, and `/api/v1/auth/whoami` are the operator auth
  surface.

## Storage

- Users remain in `User`.
- Tenant roles remain in `TenantMembership`.
- Local credential hashes are stored in `LocalAuthCredential`.
- Session hashes are stored in `LocalAuthSession`.
- Login success/failure audit is recorded in `AuditLog`.

No plain credentials are stored in Git or returned by any endpoint.

## External Providers

This hardening does not connect or mutate Twilio, ElevenLabs, Google Calendar, or PBX providers.
Provider egress and live calls remain disabled.
