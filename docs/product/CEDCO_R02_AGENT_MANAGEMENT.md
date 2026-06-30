# CEDCO R02 Agent Management

Implemented baseline:

- `VoiceAgent`
- `VoiceAgentVersion`
- Prompt/greeting fields.
- Flow/tool policy.
- Knowledge and calendar binding requirements.
- Release status: `draft`, `review`, `approved`, `active`, `archived`.

Initial agent:

- Name: CEDCO R02 Recepcion y Agendamiento.
- Locale: Spanish Colombia.
- Purpose: reception, information, scheduling and safe handoff.
- Allowed tools: answer from approved knowledge, check availability, create internal appointment,
  transfer to human, create follow-up task.
- Prohibited tools: request sensitive data, promise availability without calendar, transcript/audio
  access without approval.

Real provider mutation is blocked in this loop. The platform stores a safe internal agent model
only.
