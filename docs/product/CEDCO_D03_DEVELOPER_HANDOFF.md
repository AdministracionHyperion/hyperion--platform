# CEDCO D03 Developer Handoff

## Puede Tocar

- `modules/products/cedco/d03-fixed-assets/`.
- `packages/testing/src/products/cedco/d03-fixed-assets/`.
- `docs/product/CEDCO_D03_*`.
- `docs/architecture/CEDCO_D03_*`.
- `docs/security/CEDCO_D03_*`.

## No Puede Tocar

- D02.
- Voice.
- Dialer.
- Provider adapters.
- Prisma schema sin revision.
- API routes sin revision.
- Dashboard sin revision.
- Workers sin revision.

## Rama Recomendada

`feature/cedco-d03-fixed-assets-domain-expansion`.

## Primer Loop Recomendado

`D03-2 - Fixed-assets domain expansion and test coverage`.

## Validaciones

```bash
pnpm check
pnpm run repo:guard
pnpm db:schema:check
pnpm test
```

## Criterios De Aceptacion

- Dominio D03 expandido sin romper contratos existentes.
- Tests de dominio y policies ampliados.
- Documentacion D03 actualizada.
- Sin imports D02.
- Sin imports voice.
- Sin provider imports.
- Sin DB schema hasta revision.
- Sin API/dashboard/workers hasta revision.
- Sin datos reales.
- Reporte final con riesgos y limites.
