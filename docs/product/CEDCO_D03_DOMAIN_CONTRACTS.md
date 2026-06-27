# CEDCO D03 Domain Contracts

CEDCO D03 now has initial fixed-assets domain contracts. The scope is domain-only: value objects,
entities, policies, ports, use cases, in-memory testing utilities, and tests.

## Included

- Fixed asset identity, tag, category, location, custodian reference, status, and safe metadata.
- Fixed asset, category, location, movement, maintenance, and audit-event entities.
- Repository ports for assets, categories, and locations.
- Use cases for registration, classification, movement, maintenance, and import readiness.
- Policies that block real file imports, real document references, photos, personal identifiers,
  external URLs, and unsafe metadata.

## Not Included

- No Prisma schema or migration.
- No API routes.
- No dashboard.
- No workers.
- No D02, voice, dialer, or provider imports.
- No real CEDCO inventory data.

The next loop should review these contracts before adding persistence or API surfaces.
