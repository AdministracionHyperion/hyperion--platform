# CEDCO R02 Internal Calendar

The internal Hyperion calendar is the source of truth for R02 appointments.

Implemented baseline:

- Calendar resources by tenant, site and service type.
- Availability slots with capacity and booked count.
- Appointment creation, rescheduling and cancellation.
- Appointment status: `scheduled`, `rescheduled`, `cancelled`, `completed`, `no_show`.
- Sync status: `not_required`, `pending`, `synced`, `failed`, `retry_pending`.
- Appointment audit events for creation, reschedule and cancellation.
- Query filters by tenant, site, service and date window.

Operational rule: an agent may not promise availability without checking the internal calendar
first.

Google Calendar is not authoritative. If Google sync fails, the internal appointment remains valid
and the sync state moves to a retry or failure state.
