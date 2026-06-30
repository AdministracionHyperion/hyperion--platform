# CEDCO R02 Auth Boundary

Current staging auth mode: header-based development auth.

Boundary:

- API routes require `x-actor-id` and `x-actor-roles`.
- R02 write routes require tenant update, voice write, agent write or version activation
  permissions.
- Viewer roles can read selected surfaces but cannot create availability, appointments, knowledge or
  agents.
- Tenant ID remains path-scoped and all Prisma R02 queries filter by tenant.
- Staging demo users must not use real emails, passwords or personal data.

Open blocker:

- Production auth/OIDC is not enabled for R02 staging yet.
- A future loop must replace header-dev auth before pilot use.

Next gate:

- `APPROVE_R02_STAGING_AUTH_HARDENING`
