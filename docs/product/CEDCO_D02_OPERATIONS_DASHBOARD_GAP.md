# CEDCO D02 - Gap dashboard operativo

## Estado

El backend ya expone piezas de dominio, metricas y persistencia. Falta una experiencia operativa
para supervisar el flujo D02 de forma segura y repetible.

## Vistas minimas

| Vista               | Estado      | Contenido minimo                                            |
| ------------------- | ----------- | ----------------------------------------------------------- |
| Health staging      | PARTIAL     | Estado platform, dialer, DB e idempotencia.                 |
| Sesiones de llamada | NOT STARTED | Estado, intento, tenant, timestamps y resultado sanitizado. |
| Eventos provider    | NOT STARTED | Eventos sanitizados, sin audio/transcript raw.              |
| Post-call           | NOT STARTED | Resumen, resultado, handoff y metricas.                     |
| Auditoria           | PARTIAL     | Actor, accion, resultado y correlacion.                     |
| Errores             | NOT STARTED | Fallos por policy, provider, idempotencia y validacion.     |

## Reglas de seguridad

- No mostrar numeros reales sin redaccion.
- No mostrar transcript raw.
- No mostrar audio.
- No mostrar provider secrets.
- No exponer `agent_id` o `phone_number_id` reales en vistas generales.
- Mantener filtros por tenant.

## Siguiente implementacion segura

Crear dashboard staging con datos sinteticos y Prisma staging antes de provider egress.
