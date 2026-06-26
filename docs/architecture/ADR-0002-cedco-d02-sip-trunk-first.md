# ADR-0002: CEDCO D02 SIP trunk first

## Estado

Aceptado.

## Decision

Para CEDCO R02 / D02 llamadas se adopta Ruta B: ElevenLabs + SIP Trunk.

## Responsabilidades

Hyperion:

- Ordena la llamada desde reglas de dominio.
- Valida tenant, actor/RBAC, consentimiento, opt-out, horario, rate limit, proposito, AgentVersion y KnowledgeBaseVersion.
- Encola y audita el trabajo.
- Invoca un puerto interno de proveedor de llamadas.
- Guarda solo referencias sanitizadas, estado, metricas, auditoria y feedback.

ElevenLabs:

- Ejecuta el runtime de voz administrado.
- Maneja el agente de voz, la conversacion y la salida por SIP.
- Inicia llamadas outbound a traves del SIP trunk configurado.
- Puede enviar webhooks post-call con transcripcion, audio o fallo de inicio, que Hyperion debe validar y sanitizar antes de persistir.

SIP trunk / proveedor DID:

- Aporta numeros, DIDs y transporte telefonico.
- Enruta llamadas hacia/desde la red telefonica segun configuracion.
- Debe soportar codecs compatibles, como G711 o G722.
- Debe soportar autenticacion SIP por digest authentication o ACL segun configuracion.
- Para produccion se debe preferir TLS y media encryption cuando el proveedor lo soporte.

## Endpoint outbound documentado

ElevenLabs documenta el endpoint:

```text
POST https://api.elevenlabs.io/v1/convai/sip-trunk/outbound-call
```

Request requerido:

- `agent_id`
- `agent_phone_number_id`
- `to_number`

Response posible:

- `success`
- `message`
- `conversation_id`
- `sip_call_id`

## Posicionamiento de opciones

- ElevenLabs SIP Trunk: ruta principal fase 1.
- Twilio: fallback futuro, no ruta principal.
- Batch calls: futuro, no fase 1.
- PBX propio: futuro, no bloquea D02 outbound.
- FreeSWITCH, Kamailio y Asterisk: futuro, no fase 1.

## Consecuencias

- Hyperion no implementa telefonia propia para el primer outbound.
- La primera llamada real controlada requiere proveedor SIP/DID definido, configuracion de prueba y runbook aprobado.
- No se usan API keys, agent IDs, phone number IDs, telefonos ni datos reales en repo.
