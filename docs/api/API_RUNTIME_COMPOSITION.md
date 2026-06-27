# API Runtime Composition

`apps/api` separa la app factory de la composicion runtime.

## Modos

- `API_SERVICES_MODE=fake`: permitido solo en test/dev/local.
- `API_SERVICES_MODE=prisma`: usa `createPrismaClient({ databaseUrl })` y
  `createPrismaBackedApiServices`.

## Reglas

- `NODE_ENV=production` requiere `API_SERVICES_MODE=prisma`.
- `NODE_ENV=production` bloquea `API_SERVICES_MODE=fake`.
- `API_SERVICES_MODE=prisma` requiere `DATABASE_URL`.
- En non-test, si existe `DATABASE_URL` pero falta `API_SERVICES_MODE`, el bootstrap falla de forma
  explicita.
- Los tests unitarios siguen usando `createApiApp` con fake services inyectados y sin conectar DB.

## No Hace

- No lee provider keys.
- No activa llamadas reales.
- No crea adapter real.
- No abre puertos en tests.
- No conecta DB externa salvo que el runtime se configure explicitamente con Prisma.
