# Data Ownership and Boundaries

## Platform Data Ownership

`hyperion--platform` owns product data, tenant configuration, audit events, eval reports, dashboard
read models, and safe integration records.

All data must be tenant-scoped.

## Tenant Isolation

Every product and integration workflow must preserve:

- `tenantId`.
- `actorId` or service principal.
- `correlationId`.
- safe resource identifiers.

Cross-tenant reads or writes are forbidden unless a dedicated admin flow exists and is audited.

## D02 Data Boundaries

D02 may store:

- Safe call/session references.
- Mock runtime state.
- Sanitized provider event records.
- Post-call redacted summaries.
- Audit and metrics.
- Dialer dry-run safe references.

D02 must not store:

- Raw transcript.
- Raw audio.
- Phone number.
- Email.
- Document number.
- Raw provider payload.
- Provider secrets.

## D03 Data Boundaries

D03 currently owns domain contracts only. Future persistence must define:

- Tenant scope.
- Asset identifiers.
- Safe custodian references.
- Import/export policy.
- Audit events.
- Financial data policy.

No real Excel, invoices, photos, serial numbers, inventories, responsible persons, or accounting
values are allowed until a specific governed loop enables them safely.

## Dialer Data Boundaries

Dialer execution data belongs to the execution plane when the official service exists.

The platform should pass:

- idempotency key.
- `safeContactRef`.
- consent reference.
- callback/topic reference.
- safe dynamic variables.

The platform should not pass or persist phone numbers in product state.

## Event Boundaries

Events must carry safe metadata and must not contain raw payloads. Event consumers own their local
read models and must not infer permission from event presence alone.
