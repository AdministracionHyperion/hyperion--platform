# @hyperion/db

Paquete de persistencia de Hyperion Platform.

Incluye:

- Prisma schema target PostgreSQL en `prisma/schema.prisma`.
- Migracion inicial SQL en `prisma/migrations/0001_initial_hyperion_platform/`.
- Factory `createPrismaClient({ databaseUrl })` sin lectura directa de entorno.
- Mappers dominio <-> Prisma para Core, Agent Platform, Voice y CEDCO D02.
- Repositorios Prisma para los ports principales.
- Guards de schema para evitar campos de PII, secretos, transcript/audio crudo y alcance fuera de
  D02.

No incluye API HTTP, runtime, workers, adapters de proveedor, conexion a base real ni datos reales.
