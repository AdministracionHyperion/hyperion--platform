## Checklist

- [ ] No deploy.
- [ ] No produccion.
- [ ] No datos reales.
- [ ] No secretos.
- [ ] No `_private`.
- [ ] No paths `r03/`, `assets/` o `activos-fijos/` no autorizados.
- [ ] D03 fixed-assets solo se toca si el PR es del carril D03 y respeta boundaries.
- [ ] No proveedores reales.
- [ ] No llamadas reales.
- [ ] No provider egress.
- [ ] No DB externa real.
- [ ] No API/runtime si el PR no corresponde.
- [ ] D03 no toca D02, voice, dialer, providers, Prisma, API, dashboard ni workers salvo aprobacion
      explicita.
- [ ] `pnpm check` pasa localmente.
- [ ] `CI / Verify` pasa en GitHub.
- [ ] Se documentan riesgos y limites.

## Riesgos y limites

Describir aqui cualquier riesgo residual, decision pendiente o limite de alcance.
