# Hyperion Platform

Repositorio limpio para la plataforma multi-tenant de agentes de IA Hyperion.

El primer vertical priorizado es CEDCO R02 / D02 llamadas. R03 queda fuera del alcance actual.

La carpeta `_private/` contiene fuentes locales de referencia no commiteables y no debe subirse a
GitHub.

## Monorepo

Este repositorio usa pnpm workspaces, TypeScript, Vitest, ESLint y Prettier.

Estructura base:

- `apps/api`: skeleton HTTP contractual con Fastify, sin runtime de llamadas todavia.
- `apps/web`: boundary de dashboard/web, sin UI real todavia.
- `apps/workers`: boundary de workers, sin jobs reales todavia.
- `packages/*`: paquetes compartidos de plataforma.
- `modules/*`: bounded contexts de dominio y producto.
- `tools/`: herramientas locales de validacion.

## Scripts

- `pnpm check`: ejecuta formato, lint, Prisma checks, typecheck, tests, secret scan, architecture
  check, DB schema check y repo guard.
- `pnpm lint`: ejecuta ESLint.
- `pnpm typecheck`: ejecuta TypeScript sin emitir archivos.
- `pnpm test`: ejecuta Vitest.
- `pnpm secret:scan`: revisa patrones obvios de secretos en archivos trackeables.
- `pnpm run repo:guard`: bloquea `_private`, R03/activos fijos, `.env` reales, proveedores reales,
  runtime indebido y columnas Prisma prohibidas.

## Observabilidad

La API tiene logs estructurados, redaccion centralizada, metricas in-memory y audit events para
rutas protegidas. No hay exporter externo, APM, dashboard ni runtime de llamadas.

## CI

GitHub Actions ejecuta `CI / Verify` en pushes a `main`, pushes a `foundation/**`, pull requests
hacia `main` y ejecuciones manuales. El workflow usa `pnpm install --frozen-lockfile` y los quality
gates locales, sin secrets, sin DB real, sin deploy y sin llamadas reales.

## Estado actual

La base tecnica existe con API HTTP contractual, wiring Prisma controlado y observabilidad segura,
pero sin runtime de producto. CEDCO R02 / D02 llamadas sigue siendo el unico vertical activo.
R03/activos fijos queda fuera de alcance. No hay dashboard real, workers reales, adapter ElevenLabs,
adapter SIP, llamadas, proveedores activos, produccion ni deploy.
