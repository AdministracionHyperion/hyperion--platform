# CEDCO R02 Google Calendar Sync

Google Calendar is an external sync target, not the source of truth.

Implemented adapters:

- `DisabledGoogleCalendarAdapter`: default; no credentials, no network, no event write.
- `InMemoryTestGoogleCalendarAdapter`: test-only behavior for create/update/cancel.
- `FutureGoogleCalendarAdapter`: placeholder boundary for a future real adapter.
- `GoogleCalendarSyncJob`: maps internal appointment operations to adapter calls.

Security state:

- Real Google credentials used: NO.
- `.env` required: NO.
- External network access: NO.
- Internal appointment loss on sync failure: NO.

Future activation requires a separate approval loop, secret references, audit retention and
rollback.
