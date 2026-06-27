# API Prisma Wiring

El API puede ejecutarse con servicios fake o con servicios respaldados por Prisma mediante inyeccion
de dependencias.

## Componentes

- `createApiApp({ services })`: recibe servicios ya construidos y no conecta DB por si sola.
- `PrismaBackedApiServices`: implementa los servicios Core, Agent Platform, Voice y CEDCO D02.
- `createPrismaApiComposition(prisma)`: construye repositorios Prisma desde `packages/db`.
- `api-prisma-mappers.ts`: normaliza JSON, arrays y metadata sanitizada.

## Reglas

- El `PrismaClient` se inyecta desde un runtime o test harness externo.
- No se crea cliente Prisma al importar modulos.
- No se lee `process.env` en servicios Prisma.
- No se abre puerto HTTP durante tests.
- No hay runtime de llamadas ni proveedores reales.
- No hay DB externa en tests; solo PostgreSQL efimero/controlado.

## Cobertura actual

- Feature flags desde Prisma con default false.
- Agents y AgentVersions persistidos.
- CallSessions y CallEvents persistidos.
- CEDCO D02 configuration, scheduling requests, eligibility checks y metrics summary.
- Clasificacion, readiness, compliance y handoff siguen usando dominio deterministico.
