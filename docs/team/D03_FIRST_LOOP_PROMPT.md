# D03 First Loop Prompt

Este prompt es para un loop futuro. No se ejecuta en D03-HANDOFF-FIX.

```text
/goal D03-2 - Fixed-assets domain expansion and test coverage

Actua como arquitecto principal de software, auditor QA estricto y agente de ingenieria senior.

Repo:
C:\Users\pc\Desktop\hyperion--platform

Rama base:
main

Objetivo:
Expandir los contratos de dominio iniciales de CEDCO D03 fixed assets, aumentando policies,
use cases, tests y documentacion sin tocar DB, API, dashboard, workers, D02, voice, dialer ni
provider adapters.

Inicio:
git checkout main
git pull --ff-only origin main
git checkout -b feature/cedco-d03-fixed-assets-domain-expansion

Alcance permitido:
- modules/products/cedco/d03-fixed-assets/
- packages/testing/src/products/cedco/d03-fixed-assets/
- docs/product/CEDCO_D03_*
- docs/architecture/CEDCO_D03_*
- docs/security/CEDCO_D03_*

Restricciones:
- NO datos reales.
- NO Excel real.
- NO facturas reales.
- NO fotos reales.
- NO seriales reales.
- NO valores contables reales.
- NO Prisma schema.
- NO API routes.
- NO dashboard.
- NO workers.
- NO D02.
- NO voice.
- NO dialer.
- NO providers.

Validar:
- pnpm check
- pnpm run repo:guard
- pnpm db:schema:check
- pnpm test

Entrega:
Crear commit local y PR segun el flujo del repo. No mergear si CI falla.
```
