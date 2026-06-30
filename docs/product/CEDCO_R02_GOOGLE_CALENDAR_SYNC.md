# CEDCO R02 Google Calendar Sync

Google Calendar is an external sync target, not the source of truth.

Implemented adapters:

- `DisabledGoogleCalendarAdapter`: default; no credentials, no network, no event write.
- `InMemoryTestGoogleCalendarAdapter`: test-only behavior for create/update/cancel.
- `FutureGoogleCalendarAdapter`: placeholder boundary for a future real adapter.
- `GoogleCalendarSyncJob`: maps internal appointment operations to adapter calls.

Implemented staging/API workflow:

- `POST /api/v1/tenants/:tenantId/r02/google-calendar/:id/sync-test` confirms that the disabled
  adapter boundary is still enforced.
- `POST /api/v1/tenants/:tenantId/r02/google-calendar/:id/sync-dry-run` reads the Prisma-backed
  appointment, records a sanitized audit event, upserts a disabled sync state and returns the
  planned Google operation without using credentials or network access.
- The dry-run maps scheduled appointments to `create_event`, rescheduled appointments to
  `update_event` and cancelled appointments to `cancel_event`.
- The dashboard exposes the dry-run as `Validar Google dry-run`.

Security state:

- Real Google credentials used: NO.
- `.env` required: NO.
- External network access: NO.
- External request made by dry-run: NO.
- Provider mutation by dry-run: NO.
- Internal appointment loss on sync failure: NO.

Future activation requires a separate approval loop, secret references, audit retention and
rollback.
