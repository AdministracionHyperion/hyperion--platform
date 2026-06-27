# Repository Operating Model

## Current Official Repositories

### AdministracionHyperion/hyperion--platform

Purpose:

- Control plane.
- Product modules.
- API, DB, workers, and dashboard surfaces.
- Core, Agent Platform, Voice contracts, and integration contracts.
- CEDCO D02 and D03 product lanes.

Contains:

- Core Platform.
- Agent Platform.
- Voice Platform contracts and mock runtime.
- CEDCO D02 calls.
- CEDCO D03 fixed-assets domain contracts.
- Prisma/PostgreSQL baseline.
- Workers foundation.
- Observability, audit, metrics, policy gates, rate limits, runtime blockers.
- InternalDialerAdapter contract and D02 dry-run flow.

Does not contain:

- Dialer source code.
- VM configs.
- Real provider credentials.
- Secrets.
- Raw logs.
- Audio.
- Transcripts.
- Real phone numbers.
- Production deployment infrastructure.

### AdministracionHyperion/hyperion-dialer-sanitized

Purpose:

- Sanitized and audited dialer snapshot.
- P0 hardening baseline.
- Internal dry-run endpoint contract.
- Dispatch blocked contract.
- Idempotency, webhook signature, outcome sanitizer, and PII-safe logging documents/tests.

State:

- Temporary/historical/audit repository.
- Not imported by `hyperion--platform`.
- Not copied into `hyperion--platform`.

Future:

- Migrate or re-home the hardened implementation into `hyperion-dialer-service` when ownership, CI,
  security, and deployment rules are ready.

## Future Recommended Repositories

- `hyperion-dialer-service`: official call execution service.
- `hyperion-infra`: infrastructure as code, environment configuration, deploy workflows, runbooks.
- `hyperion-contracts`: optional shared contract repository if contract reuse becomes painful in
  product repos.
- `hyperion-docs` or `hyperion-handbook`: optional company handbook if docs outgrow product repos.

## Why Not One Repository

Hyperion should not put all code in one repo when a component has different runtime risk, deployment
cadence, provider access, operational ownership, or security posture.

The platform repo stays product/control-plane focused. Execution services stay separate when they
own live provider integrations or high-risk runtime behavior.

## Connection Model

Repositories connect through:

- Versioned API contracts.
- Event envelopes.
- Consumer-driven contract tests.
- CI checks.
- Explicit service ownership.
- Release notes and deprecation policy.

They do not connect by copying source code, sharing unversioned internals, or reading secrets from
another repo.
