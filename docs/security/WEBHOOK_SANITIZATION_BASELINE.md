# Webhook Sanitization Baseline

The sanitizer rejects webhook-style payloads that contain:

- raw payload fields.
- raw transcript or transcript fields.
- audio or recording URLs.
- phone or contact fields.
- email or document identifiers.
- API keys, tokens, secrets, or passwords.
- binary-like payloads and oversized payloads.

This loop does not persist raw webhook bodies. Logs and audit events only include event ID, tenant,
correlation ID, mock provider call reference, event type, status, and sanitized metadata.
