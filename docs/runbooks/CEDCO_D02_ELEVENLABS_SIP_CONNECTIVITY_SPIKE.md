# CEDCO D02 - ElevenLabs SIP connectivity spike

Este spike prepara una integracion futura. No ejecuta llamadas reales y no activa proveedor real en este loop.

## Checklist antes de primera integracion

- Proveedor DID/SIP definido.
- Numero E.164.
- SIP trunk compatible.
- Outbound permitido.
- TLS disponible.
- Media encryption posible.
- Codec G711/G722.
- Digest auth o ACL.
- Hostname SIP para outbound desde ElevenLabs.
- Configuracion en ElevenLabs Phone Numbers.
- `agent_id` de prueba.
- `agent_phone_number_id` de prueba.
- Webhook URL de prueba.
- Webhook secret.
- Numero interno autorizado.
- Consentimiento de prueba.
- Flags de egress apagados por defecto.

## Validaciones tecnicas

- Confirmar que las llamadas iniciadas por ElevenLabs se enrutan al SIP trunk configurado.
- Confirmar autenticacion SIP por digest authentication o ACL.
- Confirmar soporte de TLS y media encryption para produccion si el proveedor lo soporta.
- Confirmar codecs compatibles.
- Confirmar que los webhooks post-call llegan a una URL de prueba y se validan con HMAC.

## Criterio de salida del spike

- Configuracion documentada sin secretos.
- Riesgos de proveedor registrados.
- Runbook de primera llamada revisado.
- Rollback revisado.
- Ningun secreto en repo.
- Ninguna llamada real ejecutada por este documento.
