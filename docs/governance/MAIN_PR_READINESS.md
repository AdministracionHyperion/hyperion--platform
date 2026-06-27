# Main PR Readiness

Checklist antes de abrir PR de foundation hacia `main`:

- [ ] CI remoto verde.
- [ ] `CI / Verify / verify` verde.
- [ ] `CI / Verify / db-integration` verde.
- [ ] `CI / Verify / api-integration` verde.
- [ ] `_private/` no esta trackeado.
- [ ] No hay R03 no autorizado.
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

El PR no debe hacer merge automatico. La revision debe confirmar que D02 sigue mock-only y que el
carril D03 no implementa dominio funcional todavia.
