# CEDCO R02 Calendar Failure Policy

Internal calendar persistence wins over Google Calendar.

Failure handling:

- If Google sync is disabled, appointment `syncStatus` remains `not_required` or `pending`.
- If sync fails, record a sanitized `errorClass`; do not expose provider response bodies.
- Do not delete or roll back the internal appointment automatically.
- Retry only through an approved sync job; no infinite loops or uncontrolled retries.
- Calendar audit events must not include phone numbers, document numbers, raw payloads, tokens or
  provider IDs.

Pilot blocker: Google Calendar real sync remains blocked until credentials, tenant mapping, rate
limits and rollback are approved.
