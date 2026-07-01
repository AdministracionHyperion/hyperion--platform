# CEDCO D02 - Alcance de producto

## Alcance

CEDCO D02 llamadas es el primer vertical de Hyperion para agente de voz IA en un tenant dedicado.

Incluye:

- Solicitud y orquestacion de llamadas outbound.
- Intencion via LLM.
- Respuestas contextuales.
- Gestion de contexto conversacional.
- Transferencia a humano por reglas.
- Registro completo de llamadas, conversaciones y eventos en forma sanitizada.
- Gobernanza, auditoria, observabilidad y versionado.
- Dashboard operativo seguro.
- Roadmap tecnico de integracion.
- Seguridad y habeas data.

## Arquitectura seleccionada

- Hyperion: control plane.
- ElevenLabs: managed voice agent runtime.
- SIP trunk / proveedor DID: numeros, DIDs y transporte telefonico.

## No objetivos del cierre actual

- No CEDCO inventario/activos.
- No Hospital R01.
- No REDMIA R04.
- No Coopfuturo.
- No WhatsApp.
- No produccion.
- No llamadas reales continuas.
- No proveedor real activo.
- No API key real.
- No agent_id real.
- No phone_number_id real.
- No numeros reales.
- No datos reales.
- No secretos.
- No `.env` con secretos.
- No repo viejo.
- No PBX propio por ahora.
- No telefonia/PBX real en este cierre.

## Resultado esperado del loop

Un baseline operativo staging con dashboard/reporte, mock runtime, post-call/eventos sanitizados,
metricas, auditoria, evals, policy gates y roadmap/propuesta formal para avanzar sin improvisar las
integraciones futuras.
