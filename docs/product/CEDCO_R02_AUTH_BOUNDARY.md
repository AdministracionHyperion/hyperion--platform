# CEDCO R02 Auth Boundary

Current staging auth mode: Prisma-backed local staging auth.

Boundary:

- API routes require a local staging session in `AUTH_MODE=local-staging`.
- The auth plugin resolves actor and roles from `User`, `TenantMembership`, and `LocalAuthSession`.
- R02 write routes require tenant update, voice write, agent write or version activation
  permissions.
- Viewer roles can read selected surfaces but cannot create availability, appointments, knowledge or
  agents.
- Tenant ID remains path-scoped and all Prisma R02 queries filter by tenant.
- Staging demo users must not use real personal data or committed credentials.

Header-dev exception:

- `header-dev` is local/test only.
- It requires `AUTH_MODE=header-dev` and `ALLOW_HEADER_DEV_AUTH=true`.
- It is not the staging operator path.

Next gate:

- `APPROVE_TWILIO_INBOUND_NUMBER_CONNECTION`
- `APPROVE_GOOGLE_CALENDAR_OAUTH_STAGING`
- `APPROVE_SINGLE_CONTROLLED_WEBHOOK_METADATA_CALL`
