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
- Dashboard operativo futuro.
- Roadmap tecnico de integracion.
- Seguridad y habeas data.

## Arquitectura seleccionada

- Hyperion: control plane.
- ElevenLabs: managed voice agent runtime.
- SIP trunk / proveedor DID: numeros, DIDs y transporte telefonico.

## No objetivos de este loop

- No CEDCO R03 activos fijos.
- No Hospital R01.
- No REDMIA R04.
- No Coopfuturo.
- No WhatsApp.
- No produccion.
- No deploy.
- No llamadas reales.
- No proveedor real activo.
- No API key real.
- No agent_id real.
- No phone_number_id real.
- No numeros reales.
- No datos reales.
- No secretos.
- No `.env` con secretos.
- No repo viejo.
- No smoke-first.
- No PBX propio por ahora.
- No inbound por ahora.

## Resultado esperado del loop

Un baseline limpio y documentacion de arquitectura que permita iniciar desarrollo posterior sin improvisar como se lanzan llamadas outbound.
