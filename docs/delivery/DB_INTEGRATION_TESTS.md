# DB Integration Tests

Los DB integration tests validan Prisma contra PostgreSQL efimero/controlado antes de construir API,
runtime o adapters.

## Que valida

- La migracion inicial aplica con `prisma migrate deploy`.
- Prisma Client conecta a PostgreSQL temporal.
- Repositorios Prisma hacen roundtrip basico.
- `tenantId` se conserva y las queries filtran por tenant.
- Metadata se sanitiza antes de persistir.
- No se persisten telefono, transcript crudo ni audio URL en metadata.
- `OutboxEvent` puede insertarse y consultarse de forma controlada.
- El harness limpia las tablas de test al terminar.

## URL sintetica de test

La URL permitida para tests efimeros es:

```text
postgresql://hyperion_test:hyperion_test@localhost:5432/hyperion_test?schema=public
```

No es una URL de produccion, no es secreto real y no debe usarse fuera de tests/CI/documentacion.

## Ejecucion local con PostgreSQL temporal

Con Bash:

```bash
DATABASE_URL="postgresql://hyperion_test:hyperion_test@localhost:5432/hyperion_test?schema=public" pnpm db:migrate:test
DATABASE_URL="postgresql://hyperion_test:hyperion_test@localhost:5432/hyperion_test?schema=public" pnpm test:integration:db
```

Con Windows PowerShell:

```powershell
$env:DATABASE_URL="postgresql://hyperion_test:hyperion_test@localhost:5432/hyperion_test?schema=public"
pnpm db:migrate:test
pnpm test:integration:db
```

## CI

`CI / Verify` mantiene el job `verify` sin DB real. El job separado `db-integration` levanta un
service PostgreSQL temporal en GitHub Actions con credenciales sinteticas y ejecuta:

- `pnpm db:validate`
- `pnpm db:generate`
- `pnpm db:migrate:test`
- `pnpm test:integration:db`
- `pnpm db:schema:check`
- `pnpm run repo:guard`

## Limites

No usa DB externa persistente, no usa secrets, no aplica produccion, no despliega, no abre runtime y
no llama proveedores reales.
