# CEDCO R02 Operator Access Runbook

## Bootstrap

Run the staging auth bootstrap only on the VM or an approved private terminal with `DATABASE_URL`
already provided by staging runtime config:

```bash
R02_AUTH_ROTATE_CREDENTIALS=true \
R02_AUTH_PRINT_CREDENTIALS=true \
node scripts/r02-staging-auth-bootstrap.mjs
```

Optional private VM-only output path:

```bash
R02_AUTH_OUTPUT_PATH=/opt/hyperion-staging/private/r02-operator-access.txt \
node scripts/r02-staging-auth-bootstrap.mjs
```

The output must stay outside Git. Rotate credentials after handoff.

## Login

- Browser: `GET /api/v1/auth/login`.
- API: `POST /api/v1/auth/login`.
- Session check: `GET /api/v1/auth/whoami`.
- Logout: `POST /api/v1/auth/logout`.

## Validation

After bootstrap, validate:

- admin can access R02 dashboard and write R02 data.
- operator can create operational records but cannot approve compliance gates.
- viewer can read but cannot write.
- anonymous access to R02 routes returns `401`.
- audit contains login success/failure records.

No provider credentials are required for this runbook.
