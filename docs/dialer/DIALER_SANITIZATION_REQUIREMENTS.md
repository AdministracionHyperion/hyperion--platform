# Dialer Sanitization Requirements

## Se Puede Compartir

- Estructura de carpetas.
- Endpoints.
- Payloads sanitizados.
- Nombres de variables sin valores.
- `docker-compose` sanitizado.
- `package.json`.
- Flujo de llamada.
- Diagramas.

## No Se Puede Compartir

- Secrets.
- API keys.
- Tokens.
- SIP credentials.
- ElevenLabs keys.
- `agent_id` real.
- `phone_number_id` real.
- Numeros reales.
- Logs con PII.
- Transcripts.
- Audios.
- DB dumps.
- Certificados.
- Backups.
