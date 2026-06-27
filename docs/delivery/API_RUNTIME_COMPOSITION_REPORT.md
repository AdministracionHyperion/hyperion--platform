# API Runtime Composition Report

## Creado

- `API_SERVICES_MODE` con modos `fake` y `prisma`.
- Composicion runtime explicita para fake/dev y Prisma.
- Bootstrap que bloquea fake services en produccion.
- Tests de configuracion y errores de bootstrap.

## No Creado

- Auth real.
- Provider real.
- Runtime de llamadas.
- Deploy.
- DB externa.

## Validaciones

La suite local debe ejecutar `pnpm check`, `pnpm run repo:guard`, `pnpm db:schema:check` y
`pnpm test`.

## Riesgos

`AUTH_MODE=jwt-required` bloquea rutas protegidas hasta que se implemente JWT real. Ese bloqueo es
intencional.
