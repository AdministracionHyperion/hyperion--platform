# Dialer Next Actions

## Antes De Cualquier Llamada Real

1. Completar P0 hardening en el dialer.
2. Crear endpoint interno separado de demo/UI.
3. Confirmar dry-run real.
4. Confirmar idempotency key persistida.
5. Confirmar webhook signature obligatorio.
6. Confirmar auth obligatorio.
7. Confirmar sanitizacion de outcome.
8. Revisar runbook y approvals.
9. Integrar Hyperion solo por `InternalDialerAdapter`.

## Hyperion

- Mantener `dispatch` bloqueado.
- Exponer solo readiness/dry-run en loops futuros.
- No llamar `/api/demo/call`.
- No llamar campaign start.
- No llamar ElevenLabs/SIP/Twilio.
