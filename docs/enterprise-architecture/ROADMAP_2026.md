# Roadmap 2026

## Phase 0: Foundation Complete

Completed foundation:

- Core Platform.
- Agent Platform.
- Voice contracts.
- CEDCO D02 domain.
- CEDCO D03 domain contracts.
- API/Prisma/PostgreSQL baseline.
- Workers foundation.
- Observability.
- Policy gates, rate limits, runtime blockers.
- Mock runtime and provider events.
- Evals.
- Dashboard.
- Governance and branch protection.

## Phase 1: Controlled Dry-Runs

Current focus:

- Internal dialer dry-run contract.
- D02 dry-run E2E.
- Audit and metrics.
- No provider egress.

## Phase 2: Dialer Hardening Continuation

Next:

- Atomic dispatcher claim.
- Idempotency persistence.
- Webhook contract hardening.
- Outcome retention policy.
- Execution service ownership.

## Phase 3: Staging/Sandbox

Add:

- Staging environment plan.
- Sandbox provider-only rules.
- Secret manager references.
- Deployment runbooks.

## Phase 4: First Controlled Real Calls

Only after gates:

- Production auth.
- Secret manager.
- Provider config.
- Approval.
- Runbook.
- Monitoring.
- Rollback.

## Phase 5: D03 DB/API

After D03 domain expansion:

- Prisma review.
- API contracts.
- Integration tests.
- Dashboard read model.
- Import/export controls.

## Phase 6: Production Readiness

Add:

- Environment hardening.
- Security scans.
- Backup/restore.
- Incident runbooks.
- Release governance.

## Phase 7: Infra Repo And Service Split

Create when ready:

- `hyperion-infra`.
- `hyperion-dialer-service`.
- Cross-service contracts.
- Deployment pipelines.

## Phase 8: Enterprise Observability

Add:

- Alerts.
- SLOs.
- Central dashboards.
- Retention policy.
- Operational reviews.
