# D03 Start Here

## Para El Dev D03

1. Leer `docs/product/CEDCO_D03_PRODUCT_SCOPE.md`.
2. Leer `docs/architecture/CEDCO_D03_VERTICAL_BOUNDARIES.md`.
3. Leer `docs/product/CEDCO_D03_DEVELOPER_HANDOFF.md`.
4. Crear rama desde `foundation/cedco-d02-sip-first-architecture`.

Rama recomendada:

```bash
git checkout foundation/cedco-d02-sip-first-architecture
git pull
git checkout -b feature/cedco-d03-fixed-assets-domain
```

## Validar

```bash
pnpm install
pnpm check
pnpm run repo:guard
```

## No Tocar

- D02.
- Voice.
- Dialer.
- Providers.
- Prisma schema sin revision.
- Datos reales.

## Reporte

Entregar cambios, validaciones, limites, riesgos y commit. No hacer push si los checks fallan.
