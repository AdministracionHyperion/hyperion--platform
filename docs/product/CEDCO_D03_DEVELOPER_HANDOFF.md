# CEDCO D03 Developer Handoff

## Puede Tocar

- `modules/products/cedco/d03-fixed-assets/`.
- `docs/product/CEDCO_D03_*`.
- `docs/architecture/CEDCO_D03_*`.
- `docs/security/CEDCO_D03_*`.
- `packages/testing/src/products/cedco/d03-fixed-assets/`.

## No Puede Tocar

- `modules/products/cedco/d02-calls/`.
- `modules/voice/`.
- Dialer.
- Provider adapters.
- Rutas D02.
- Workers D02.
- Evals D02.
- Dashboard D02.
- `packages/db/prisma/schema.prisma` sin revision.

## Rama Recomendada

`feature/cedco-d03-fixed-assets-domain`.

## Primer Loop Recomendado

`D03-1 - Domain contracts for fixed assets`.

## Validaciones

```bash
pnpm check
pnpm run repo:guard
pnpm db:schema:check
pnpm test
```

## Criterios De Aceptacion

- Dominio D03 aislado.
- Sin imports D02.
- Sin imports voice.
- Sin provider imports.
- Sin DB schema hasta revision.
- Sin datos reales.
- Reporte final con riesgos y limites.
