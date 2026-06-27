# CEDCO D03 Delivery Roadmap

## Estado

D03 tiene carril habilitado, documentacion base y contratos iniciales de dominio. No hay DB, API,
dashboard, workers, migraciones ni import/export real.

## Secuencia Recomendada

1. D03-1 domain contracts. Completado.
2. D03-2 domain expansion and test coverage.
3. D03-3 inventory model hardening.
4. D03-4 movement lifecycle.
5. D03-5 depreciation rules.
6. D03-6 audit/reporting.
7. D03-7 DB/API review.
8. D03-8 dashboard.
9. D03-9 import/export controls.

## Gates

- No tocar D02.
- No tocar voice.
- No provider imports.
- No Prisma schema sin revision.
- No datos reales.
- `pnpm check` y repo guard verdes.
