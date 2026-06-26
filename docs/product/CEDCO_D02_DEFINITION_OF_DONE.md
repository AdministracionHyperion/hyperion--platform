# CEDCO D02 - Definition of Done

## DoD de este loop

- Repo Git limpio inicializado o verificado contra el remoto oficial.
- `_private/` ignorado por Git.
- Word fuente locales usados solo como referencia.
- Documentacion sanitizada creada en `docs/`.
- Decision Ruta B documentada: ElevenLabs + SIP Trunk.
- Hyperion documentado como control plane.
- `CallProviderPort` documentado como puerto conceptual.
- Estados y razones de bloqueo documentados.
- Limites de datos, habeas data y sanitizer de webhook documentados.
- Runbooks previos a primera llamada real documentados.
- Sin runtime, apps, modules, tests, installs, llamadas reales ni push.

## DoD futuro antes de integracion real

- Modelo de dominio aprobado.
- Contratos internos definidos.
- Persistencia de estados y auditoria implementada.
- Mock provider implementado y validado.
- Webhook sanitizer implementado y validado.
- Observabilidad minima implementada.
- Evals aprobados.
- Smoke local aprobado al final.
- Runbook revisado.
- Rollback definido.
- Secret manager configurado.
- Flags de egress apagados por defecto y habilitables manualmente.
- Aprobacion humana explicita para cualquier llamada real.
