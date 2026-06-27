# Environment Strategy

## Local

Purpose:

- Development.
- Unit tests.
- Contract tests.

Rules:

- No provider egress.
- No real calls.
- No real secrets.
- No real data.
- Fake or local services only.

## Test

Purpose:

- Deterministic CI checks.
- Unit and contract tests.

Rules:

- No provider egress.
- No real calls.
- Ephemeral data only.
- No secrets.

## Integration

Purpose:

- API and DB integration with ephemeral PostgreSQL.
- Cross-module validation.

Rules:

- No provider egress.
- No real calls.
- PostgreSQL service is ephemeral.
- No persistent external DB.

## Staging

Purpose:

- Validate deployable artifacts and sandbox integrations.

Rules:

- Sandbox provider only when explicitly approved.
- No real customer data.
- Secret manager required.
- Audit and metrics required.

## Preprod

Purpose:

- Final production-like validation.

Rules:

- Sandbox or controlled provider configuration only.
- Approval required.
- Runbook required.
- Rollback required.

## Production

Purpose:

- Live customer operations.

Rules:

- Production auth required.
- Secret manager required.
- Policy gates required.
- Provider egress gates required.
- Real calls require explicit runbook and approval.
- First real call requires dedicated runbook and documented outcome.

## Environment Matrix

| Environment | DB                   | Secrets         | Provider egress | Real calls                  | Deploy   |
| ----------- | -------------------- | --------------- | --------------- | --------------------------- | -------- |
| local       | local/none           | no real secrets | no              | no                          | no       |
| test        | none/ephemeral       | no real secrets | no              | no                          | CI only  |
| integration | ephemeral PostgreSQL | no real secrets | no              | no                          | CI only  |
| staging     | managed staging      | secret manager  | sandbox only    | no, unless approved sandbox | approved |
| preprod     | managed preprod      | secret manager  | controlled      | controlled only             | approved |
| prod        | managed prod         | secret manager  | gated           | gated                       | approved |
