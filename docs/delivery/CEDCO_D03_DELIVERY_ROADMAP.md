# CEDCO D03 Delivery Roadmap

## Estado

D03 tiene carril habilitado y documentacion base. No hay dominio funcional todavia.

## Secuencia Recomendada

1. D03-1 domain contracts.
2. D03-2 inventory model.
3. D03-3 movement lifecycle.
4. D03-4 depreciation rules.
5. D03-5 audit/reporting.
6. D03-6 DB/API review.
7. D03-7 dashboard.
8. D03-8 import/export controls.

## Gates

- No tocar D02.
- No tocar voice.
- No provider imports.
- No Prisma schema sin revision.
- No datos reales.
- `pnpm check` y repo guard verdes.
