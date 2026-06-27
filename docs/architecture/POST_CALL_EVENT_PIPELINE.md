# Post-Call Event Pipeline

The post-call pipeline starts from a sanitized mock provider event and maps it into operational
CEDCO D02 outcomes.

## Pipeline

1. Mock event is ingested and verified with a synthetic signature.
2. Replay protection blocks duplicate `eventId` values.
3. The event is normalized into `SanitizedProviderEvent`.
4. Voice workers can process sanitized events.
5. CEDCO D02 maps the event into an operational outcome and safe summary.
6. Prisma-backed API services reuse existing `ProviderCallEvent`, `PostCallResult`, and `AuditLog`
   tables.

## Clinical Boundary

CEDCO D02 post-call processing does not diagnose, interpret clinical data, triage clinically, expose
patient records, or store raw transcript/audio. Handoff remains an operational recommendation only.
