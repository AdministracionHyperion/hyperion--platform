# ADR-0003: ElevenLabs como managed voice runtime

## Estado

Aceptado.

## Contexto

CEDCO D02 necesita validar una experiencia de voz con baja friccion operativa sin construir PBX propio ni stack de telefonia en fase 1.

ElevenLabs SIP Trunk permite conectar infraestructura telefonica existente con ElevenLabs Agents. Soporta inbound y outbound, aunque este loop limita la arquitectura a outbound.

## Decision

ElevenLabs sera el managed voice agent runtime para D02 fase 1.

ElevenLabs maneja:

- Agente de voz.
- Conversacion administrada.
- Inicio de llamada outbound por SIP.
- Enrutamiento de llamadas iniciadas por ElevenLabs al SIP trunk configurado.
- Webhooks post-call, incluidos resultados, fallos de inicio y payloads que pueden contener transcripcion o audio.

Hyperion mantiene:

- Control plane.
- Validaciones previas.
- Auditoria.
- Estado y lifecycle de la llamada.
- Sanitizacion y persistencia minima.
- Integracion por puerto, no por dependencia directa de dominio.

## Restricciones

- Hyperion no acopla el dominio a ElevenLabs.
- Configuracion sensible nunca va al repo.
- No se guardan API keys, agent IDs reales, phone number IDs reales, numeros reales ni secrets.
- No hay llamadas reales hasta tener flags explicitos, runbook aprobado, secret manager configurado, logs sanitizados y aprobacion humana.
- Los webhooks deben validarse con HMAC antes de procesar payload.
- Hyperion no debe guardar raw transcript ni audio crudo por defecto.

## Seguridad de transporte

Para produccion se debe preferir:

- TLS para SIP cuando el proveedor lo soporte.
- Media encryption cuando el proveedor lo soporte.
- Codecs compatibles como G711 o G722.
- Autenticacion por digest authentication o ACL segun el proveedor y la configuracion.

## Consecuencias

El primer adapter real sera `ElevenLabsSipTrunkAdapter`, pero no se implementa en este loop.
