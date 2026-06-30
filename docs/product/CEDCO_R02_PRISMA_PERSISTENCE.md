# CEDCO R02 Prisma Persistence

Status: implemented for the operational R02 surface.

Prisma-backed entities:

- `CalendarResource`
- `AvailabilitySlot`
- `Appointment`
- `CalendarSyncState`
- `KnowledgeBase`
- `KnowledgeDocument`
- `KnowledgeDocumentVersion`
- `KnowledgeChunk`
- `KnowledgeIngestionJob`
- `VoiceAgent`
- `VoiceAgentVersion`
- `AgentFlow`
- `AgentToolPolicy`
- `AgentKnowledgeBinding`
- `AgentCalendarBinding`
- `HandoffTarget`
- `R02AuditEvent`

Runtime behavior:

- R02 routes use Prisma when the API runs with `API_SERVICES_MODE=prisma`.
- Demo seed is idempotent and reports `storageMode=prisma`.
- Calendar writes create R02 audit events.
- Knowledge upload stores sanitized chunks only.
- Agent versioning stores safe prompts, tool policy and bindings.
- Google Calendar remains disabled and writes only a safe sync state.

Explicit no-go:

- No Google credentials.
- No Twilio connection.
- No PBX connection.
- No ElevenLabs mutation.
- No provider egress.
- No live calls.
- No transcript/audio access.
