# CEDCO D02 - Webhook sanitizer

## Objetivo

Convertir webhooks post-call de proveedor en eventos internos seguros, auditables y minimizados.

## Entradas esperadas

ElevenLabs post-call webhooks pueden entregar:

- Resultado de llamada.
- Fallo de inicio de llamada.
- Transcripcion.
- Audio.
- Referencias como `conversation_id` y `sip_call_id`.

## Reglas obligatorias

1. Recibir webhook.
2. Verificar HMAC.
3. Rechazar payload sin firma valida.
4. Asociar con `tenantId` y `correlationId` existentes.
5. Normalizar referencias de proveedor.
6. Remover raw transcript por defecto.
7. Remover audio crudo por defecto.
8. Redactar telefonos y PII si aparecen en metadata.
9. Persistir solo eventos, metricas, resumen permitido, clasificaciones y referencias sanitizadas.
10. Emitir audit log de aceptacion, rechazo o sanitizacion.

## Salida interna

La salida del sanitizer debe contener como maximo:

- Estado derivado.
- Razon de fallo o bloqueo si aplica.
- Duracion o metricas permitidas.
- Flags de handoff, voicemail, completed o failed.
- Referencias sanitizadas.
- Resumen seguro si esta habilitado por politica.

## Bloqueos

Se debe bloquear ingestion si:

- HMAC es invalido.
- Falta correlacion interna.
- El payload viola politica PII.
- El tenant esta deshabilitado.
- El evento intenta persistir raw transcript o audio crudo sin una politica explicita aprobada.
