# D03 Start Here

## Para El Dev D03

1. Leer `docs/product/CEDCO_D03_PRODUCT_SCOPE.md`.
2. Leer `docs/product/CEDCO_D03_DOMAIN_CONTRACTS.md`.
3. Leer `docs/architecture/CEDCO_D03_VERTICAL_BOUNDARIES.md`.
4. Leer `docs/product/CEDCO_D03_DEVELOPER_HANDOFF.md`.
5. Partir desde `main`, no desde la rama foundation D02.

Rama recomendada:

```bash
git checkout main
git pull --ff-only origin main
git checkout -b feature/cedco-d03-fixed-assets-domain-expansion
```

## Estado Actual

D03 ya tiene domain contracts iniciales en `modules/products/cedco/d03-fixed-assets`. El siguiente
trabajo recomendado no es empezar desde cero, sino expandir dominio, tests y docs.

## Validar

```bash
pnpm install
pnpm check
pnpm run repo:guard
pnpm db:schema:check
pnpm test
```

## No Tocar

- D02.
- Voice.
- Dialer.
- Providers.
- Prisma schema sin revision.
- API, dashboard o workers D03 sin aprobacion.
- Datos reales.

## Reporte

Entregar cambios, validaciones, limites, riesgos y commit. No hacer push si los checks fallan.
