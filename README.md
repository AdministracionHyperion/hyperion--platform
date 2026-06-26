# Hyperion Platform

Repositorio limpio para la plataforma multi-tenant de agentes de IA Hyperion.

El primer vertical priorizado es CEDCO R02 / D02 llamadas. R03 queda fuera del alcance actual.

La carpeta `_private/` contiene fuentes locales de referencia no commiteables y no debe subirse a
GitHub.

## Monorepo

Este repositorio usa pnpm workspaces, TypeScript, Vitest, ESLint y Prettier.

Estructura base:

- `apps/api`: boundary de API, sin servidor real todavia.
- `apps/web`: boundary de dashboard/web, sin UI real todavia.
- `apps/workers`: boundary de workers, sin jobs reales todavia.
- `packages/*`: paquetes compartidos de plataforma.
- `modules/*`: bounded contexts de dominio y producto.
- `tools/`: herramientas locales de validacion.

## Scripts

- `pnpm check`: ejecuta formato, lint, typecheck, tests y secret scan.
- `pnpm lint`: ejecuta ESLint.
- `pnpm typecheck`: ejecuta TypeScript sin emitir archivos.
- `pnpm test`: ejecuta Vitest.
- `pnpm secret:scan`: revisa patrones obvios de secretos en archivos trackeables.

## Estado actual

La base tecnica existe sin runtime de producto. No hay API real, dashboard real, workers reales,
base de datos real, adapter ElevenLabs, llamadas ni proveedores activos.
