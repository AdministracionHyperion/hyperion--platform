# Dialer Integration Security Baseline

## Bloqueos

- No llamadas reales.
- No provider egress.
- No ElevenLabs directo.
- No SIP directo.
- No Twilio directo.
- No `/api/demo/call`.
- No `/api/campaigns/{campaign_id}/start`.
- No rutas `/dispatch`, `/real-call` o `/provider-egress`.
- No HTTP client real.

## Datos Prohibidos

- Telefono real.
- `phoneNumber`, `phone`, `to_number`, `from_number`.
- `agent_id` real.
- `phone_number_id` real.
- Transcript crudo.
- Audio URL.
- Recording URL.
- Raw payload.
- Email.
- Documento.
- `apiKey`, token, secret o password.

## Requisitos Para Futuro Live

- P0 hardening completo.
- Policy gates verdes.
- Approval ref.
- Runbook ref.
- Provider config ref.
- Secret manager ref.
- Idempotency key persistida.
- Dry-run real.
- Firma webhook obligatoria.
- Auth obligatorio en prod.
- Sin raw outcome persistence.
- Endpoint interno separado de demo/UI.
