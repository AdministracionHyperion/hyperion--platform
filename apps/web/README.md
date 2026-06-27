# Hyperion Web

`apps/web` contiene el skeleton del dashboard operacional de Hyperion.

## Estado

- UI TypeScript/HTML/CSS sin framework nuevo.
- Dashboard solo lectura para CEDCO D02.
- Summary cards, mock call flows, provider events, eval summary, policy gates, runtime safety,
  audit, metricas y controles futuros deshabilitados.
- Cliente API inyectable que solo acepta rutas internas relativas.

## Seguridad

No hay botones peligrosos habilitados, dispatch, provider egress, llamadas reales, URLs externas,
SDKs de proveedor, tokens, telefonos reales, transcript crudo ni audio crudo. Los controles futuros
estan deshabilitados y no tienen handlers funcionales.

## Tests

Los tests renderizan componentes como strings y validan que la UI no muestre datos sensibles ni
exponga acciones peligrosas.
