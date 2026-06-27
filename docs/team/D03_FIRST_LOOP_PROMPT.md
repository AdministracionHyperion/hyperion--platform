# D03 First Loop Prompt

Este prompt es para un loop futuro. No se ejecuta en PRE-DIALER READY.

```text
/goal D03-1 — Domain contracts for fixed assets

Actua como arquitecto principal de software y agente de ingenieria senior.

Objetivo:
Implementar contratos de dominio iniciales para CEDCO D03 fixed assets sin DB, sin API, sin
dashboard, sin imports D02, sin voice, sin dialer y sin provider adapters.

Alcance:
- Value objects seguros.
- Entidades de dominio iniciales.
- Policies.
- Ports.
- Use cases.
- Tests unitarios.
- Docs de limites.

Restricciones:
- NO datos reales.
- NO Excel real.
- NO facturas reales.
- NO fotos reales.
- NO seriales reales.
- NO Prisma schema.
- NO API routes.
- NO dashboard.
- NO workers.
- NO D02.
- NO voice.
- NO providers.

Validar:
- pnpm check
- pnpm run repo:guard
- pnpm db:schema:check
- pnpm test
```
