# ADR-0006: No smoke-first

## Estado

Aceptado.

## Decision

Queda prohibido smoke-first para CEDCO D02.

Smoke no define arquitectura. Smoke solo entra al final para verificar que una cadena ya disenada cumple los criterios minimos.

## Orden correcto

1. Dominio.
2. Contratos.
3. Persistencia.
4. Adapters.
5. Seguridad.
6. Observabilidad.
7. Evals.
8. Integracion.
9. Smoke final.

## Consecuencias

- No se crean llamadas reales para descubrir arquitectura.
- No se instala stack telefonico antes de definir puertos y limites de datos.
- No se implementa adapter real antes de documentar estados, seguridad, auditoria y runbooks.
- Los smoke tests futuros validaran integracion, no decidiran el diseno.
