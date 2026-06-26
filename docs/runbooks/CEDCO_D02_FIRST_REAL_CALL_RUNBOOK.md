# CEDCO D02 - First real call runbook

Este runbook documenta la primera llamada real controlada futura. No se ejecuta todavia.

## Precondiciones obligatorias

- Evals aprobados.
- Smoke local aprobado.
- Webhook sanitizer aprobado.
- Logs sanitizados.
- Runbook revisado.
- Rollback definido.
- Aprobacion humana explicita.
- Numero de prueba autorizado.
- Consentimiento.
- Flags habilitados manualmente.
- Secret manager configurado.
- No `.env` con secretos en repo.

## Preparacion

1. Verificar rama y commit aprobados.
2. Verificar que `real_calls_disabled` este activo por defecto.
3. Verificar tenant de prueba.
4. Verificar actor/RBAC.
5. Verificar consentimiento y opt-out.
6. Verificar AgentVersion y KnowledgeBaseVersion activas.
7. Verificar proveedor configurado desde secret manager.
8. Verificar webhook URL y webhook secret.
9. Verificar HMAC con payload de prueba.
10. Verificar dashboard/logs sanitizados.

## Ejecucion futura

1. Habilitar flag manualmente para una unica llamada autorizada.
2. Crear solicitud con `calleeAlias` de prueba.
3. Aprobar manualmente.
4. Encolar.
5. Despachar.
6. Verificar `conversation_id` y `sip_call_id` como referencias sanitizadas.
7. Esperar webhook.
8. Validar HMAC.
9. Sanitizar payload.
10. Revisar estado final y audit log.
11. Apagar flag de egress real.

## Abort conditions

- Falta consentimiento.
- Opt-out activo.
- Logs muestran PII.
- HMAC falla.
- Secret manager no disponible.
- Proveedor no verificado.
- Audio o transcript crudo intenta persistirse.
- No hay aprobacion humana explicita.
