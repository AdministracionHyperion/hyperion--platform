# Auth Production Blocker

La API sigue usando headers controlados (`x-actor-id`, `x-actor-roles`) solo para desarrollo y
tests. Este mecanismo no es auth real.

## Modos

- `AUTH_MODE=header-dev`: permitido solo en test/dev/local.
- `AUTH_MODE=local-staging`: permitido para staging operador con sesiones locales Prisma.
- `AUTH_MODE=jwt-required`: requerido para `NODE_ENV=production`.

## Reglas De Bootstrap

- Produccion falla si `AUTH_MODE` no esta definido.
- Produccion falla con `AUTH_MODE=header-dev`.
- `AUTH_MODE=jwt-required` requiere una referencia de verificador:
  - `AUTH_JWKS_URL`.
  - `AUTH_JWT_PUBLIC_KEY_REF`.
  - `AUTH_PROVIDER_REF` puede acompanar la referencia, pero no reemplaza JWKS/public key.

## Runtime Actual

Cuando `jwt-required` esta activo, las rutas protegidas exigen Bearer JWT RS256 con tenant, subject
y roles. Si no existe `AUTH_JWKS_URL` o `AUTH_JWT_PUBLIC_KEY_REF`, el bootstrap bloquea el runtime.
`/health` y `/api/v1/version` siguen publicas.

## No Hace

- No usa secretos reales.
- No crea `.env`.
- No habilita `header-dev` en produccion.
