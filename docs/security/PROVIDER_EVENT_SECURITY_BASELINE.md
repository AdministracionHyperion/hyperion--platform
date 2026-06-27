# Provider Event Security Baseline

Provider event ingestion is mock-only in this loop.

Security controls:

- synthetic signature required for integration and API tests.
- replay protection is in-memory.
- only `source=mock` is accepted.
- provider call references must be synthetic and start with `mock_call_`.
- payloads are sanitized before normalization.
- dangerous fields are rejected before persistence.
- audit, metrics, and logs use sanitized metadata.

No provider SDK, provider egress, production webhook, real secret, real call, real phone number, raw
transcript, raw audio, or external database is used.
