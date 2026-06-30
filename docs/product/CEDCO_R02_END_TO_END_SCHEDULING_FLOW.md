# CEDCO R02 End-To-End Scheduling Flow

Implemented synthetic operational flow:

1. Create an internal calendar resource and service type.
2. Create availability slots.
3. Simulate a scheduling intent.
4. Query availability.
5. Create an internal appointment.
6. Leave external calendar sync as `pending` or disabled.
7. Write a sanitized audit event.
8. Search approved RAG chunks and cite source/version.
9. If unresolved, route to a human/PBX handoff target reference.

Data policy:

- Internal calendar remains the source of truth.
- External calendar is not the source of truth.
- No real credentials are used.
- No calls are made.
- No transcript/audio is accessed.
- No raw provider payload is persisted.
