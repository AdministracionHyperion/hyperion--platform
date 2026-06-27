# CEDCO D02 - Matriz de proveedores

| Opcion                       | Estado           | Uso permitido | Notas                                                                                             |
| ---------------------------- | ---------------- | ------------- | ------------------------------------------------------------------------------------------------- |
| Mock provider                | Desarrollo local | Permitido ya  | No hace egress ni llamadas reales. Debe implementar el contrato conceptual de `CallProviderPort`. |
| ElevenLabs SIP Trunk         | Ruta principal   | Fase 1        | Managed voice runtime con outbound por SIP trunk. Primer adapter real planeado.                   |
| ElevenLabs Twilio            | Fallback futuro  | No fase 1     | Puede evaluarse si SIP trunk no cumple requisitos o si se necesita alternativa operativa.         |
| ElevenLabs Batch             | Futuro           | No fase 1     | No usar batch calls en este loop ni para la primera llamada controlada.                           |
| PBX propio                   | Futuro/inbound   | No fase 1     | Para inbound, IVR interno, colas, redireccion a humano y reglas de transferencia.                 |
| FreeSWITCH/Kamailio/Asterisk | Futuro           | No fase 1     | No instalar, disenar ni usar como base de D02 outbound inicial.                                   |

## Decision

La ruta principal es ElevenLabs SIP Trunk. El dominio de Hyperion no depende directamente de ninguna
opcion de esta matriz; depende de `CallProviderPort`.
