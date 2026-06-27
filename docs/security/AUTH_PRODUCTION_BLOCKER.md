# Auth Production Blocker

La API sigue usando headers controlados (`x-actor-id`, `x-actor-roles`) solo para desarrollo y
tests. Este mecanismo no es auth real.

## Modos

- `AUTH_MODE=header-dev`: permitido solo en test/dev/local.
- `AUTH_MODE=jwt-required`: requerido para `NODE_ENV=production`.

## Reglas De Bootstrap

- Produccion falla si `AUTH_MODE` no esta definido.
- Produccion falla con `AUTH_MODE=header-dev`.
- `AUTH_MODE=jwt-required` requiere una referencia futura:
  - `AUTH_JWKS_URL`.
  - `AUTH_JWT_PUBLIC_KEY_REF`.
  - `AUTH_PROVIDER_REF`.

## Runtime Actual

Cuando `jwt-required` esta activo, las rutas protegidas quedan bloqueadas hasta implementar
validacion JWT real. `/health` y `/api/v1/version` siguen publicas.

## No Hace

- No implementa JWT real.
- No usa secretos reales.
- No crea `.env`.
- No expone endpoints productivos.
