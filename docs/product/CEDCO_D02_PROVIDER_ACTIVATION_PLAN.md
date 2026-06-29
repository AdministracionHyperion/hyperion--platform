# CEDCO D02 - Plan de activacion de proveedor

## Principio

La activacion de proveedor es un cambio de riesgo alto. No debe hacerse desde docs, PRs o prompts.
Los valores reales se ingresan solo como configuracion runtime segura y nunca se versionan.

## Secuencia

1. Inventariar cuenta ElevenLabs actual sin exponer valores.
2. Inventariar cuenta ElevenLabs nueva sin exponer valores.
3. Confirmar Telyaco/SIP host, usuario, password y DDI disponibles.
4. Confirmar caller IDs permitidos.
5. Crear/agendar agente ElevenLabs real con nombre, voz, opening script y comportamiento de handoff.
6. Configurar secret manager/runtime refs.
7. Ejecutar rehearsal sin egress.
8. Habilitar provider egress solo con aprobacion humana explicita.
9. Ejecutar una llamada controlada.
10. Revisar eventos, post-call, auditoria y rollback.

## Inputs humanos requeridos

- API key de cuenta ElevenLabs vieja, solo cuando inicie inventario.
- API key de cuenta ElevenLabs nueva, solo cuando inicie provisioning.
- Telyaco SIP host.
- SIP username.
- SIP password.
- Lista DDI.
- Caller IDs permitidos.
- Confirmacion de si los DDI estan asociados a la cuenta vieja.
- Nombre deseado del agente.
- Voz.
- Opening script.
- Politica de escalamiento/handoff.
- Politica de grabacion.
- URL futura de webhook.
- Reglas de consentimiento/compliance.

## Prohibiciones

- No valores en repo.
- No valores en prompt.
- No provider egress antes de aprobacion.
- No llamada real antes del runbook de primera llamada.
