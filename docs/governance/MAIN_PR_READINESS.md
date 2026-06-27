# Main PR Readiness

Checklist antes de abrir PR hacia `main`:

- [ ] CI remoto verde.
- [ ] `CI / Verify / verify` verde.
- [ ] `CI / Verify / db-integration` verde.
- [ ] `CI / Verify / api-integration` verde.
- [ ] `_private/` no esta trackeado.
- [ ] No hay paths `r03/`, `assets/` o `activos-fijos/` no autorizados.
- [ ] No hay `modules/products/cedco/assets`.
- [ ] No hay `modules/products/cedco/activos-fijos`.
- [ ] No hay providers reales.
- [ ] No hay deploy.
- [ ] No hay llamadas reales.
- [ ] No hay datos reales.
- [ ] No hay secrets.
- [ ] No hay DB externa real.
- [ ] No hay rutas reales de webhook o dispatch.
- [ ] El PR describe limites mock-only.
- [ ] El PR incluye riesgos residuales.
- [ ] Reviewers asignados.

El PR no debe hacer merge automatico. La revision debe confirmar que D02 sigue mock-only y que D03
solo toca el carril autorizado con boundaries, sin DB/API/dashboard/workers salvo aprobacion
explicita.
