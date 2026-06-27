# Hyperion Enterprise Architecture

## Vision

Hyperion is the multi-tenant control plane for regulated operational products. The platform owns
product modules, tenant-scoped business rules, API contracts, persistence, workers, dashboard
read-models, audit, evals, and safety gates.

Specialized engines execute risky or high-load work outside the product control plane. Deployment
automation lives in a separate deployment plane when the project is ready for real environments.

## Planes

- Control plane: `hyperion--platform`.
- Execution plane: specialized services such as future `hyperion-dialer-service`.
- Deployment plane: future `hyperion-infra`.
- External providers: ElevenLabs, SIP/DID providers, and other vendors only behind approved
  contracts and policy gates.

Textual architecture:

```text
hyperion--platform
  -> InternalDialerAdapter
    -> hyperion-dialer-service
      -> providers
```

## Product Placement

CEDCO product verticals live in `hyperion--platform` while their behavior is domain-first and
contract-first:

- CEDCO D02 calls: product/domain/API/mock runtime/dry-run flow in platform.
- CEDCO D03 fixed assets: domain contracts in platform, no DB/API/dashboard yet.
- Future D04 or adjacent products: added only with product scope, boundaries, security baseline,
  roadmap, tests, and repo guard coverage.

Specialized runtime engines can move outside the repo when they have different risk, scaling,
security, or ownership requirements.

## Principles

- Contract-first integrations: services connect through explicit versioned contracts, not copied
  code.
- Secure by default: real calls, provider egress, raw transcript, raw audio, production deploy, and
  data export are blocked unless explicit gates are satisfied.
- No secrets in repositories: source code and docs may reference secret manager refs, never values.
- No real provider egress without gates: provider access requires approvals, runbooks, flags, secret
  manager refs, audit, and CI.
- Audit, evals, and observability first: every sensitive workflow needs correlation ID, tenant ID,
  logs, metrics, audit, tests, and eval coverage.
- Tenant isolation by design: all product and operational data is scoped to tenant and actor
  context.

## Current State

The platform has a governed mock/dry-run foundation with CI, branch protection, API runtime
composition, auth production blocker, D02 metadata allowlists, D03 boundaries, dialer readiness, and
controlled D02 dialer dry-run.

It still does not have production deploy, live calls, provider egress, real SIP/ElevenLabs adapters,
real auth verification, or a secret manager integration.
