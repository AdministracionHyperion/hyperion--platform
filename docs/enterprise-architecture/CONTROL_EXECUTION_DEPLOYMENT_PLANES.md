# Control, Execution, and Deployment Planes

## Control Plane

The control plane decides what should happen, validates it, audits it, and stores product state.

In Hyperion this is `hyperion--platform`:

- Product domain modules.
- API routes.
- Persistence contracts.
- Workers foundation.
- Dashboard read models.
- Policy gates.
- Rate limits.
- Runtime blockers.
- Evals.

The control plane does not directly execute real provider operations until gates, approvals,
runbooks, and service contracts exist.

## Execution Plane

The execution plane performs specialized work that has distinct operational risk.

Examples:

- Future `hyperion-dialer-service`.
- Future document processing service.
- Future heavy analytics or billing service.

Execution services must not skip the control plane for critical tenant operations. They receive
contracted requests, enforce their own safety baseline, emit audit/metrics, and return sanitized
results.

## Deployment Plane

The deployment plane provisions and deploys runtime environments.

Future `hyperion-infra` should own:

- IaC.
- Environment definitions.
- Service account boundaries.
- Secret manager references.
- Release workflows.
- Rollback workflows.
- Operational runbooks.

No deploy should happen without CI, approval, runbook, rollback plan, and environment-specific
configuration.

## Cross-Plane Rules

- Control plane owns product intent and audit.
- Execution plane owns specialized runtime execution.
- Deployment plane owns environment lifecycle.
- Execution plane cannot self-authorize critical work.
- Deployment plane cannot bypass product policy gates.
- Secrets are referenced, not committed.
- Provider egress requires explicit gates.
