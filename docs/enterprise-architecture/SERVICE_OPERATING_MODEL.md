# Service Operating Model

## Control Plane Services

### Hyperion Platform API

Responsibilities:

- Tenant-scoped product decisions.
- API validation.
- Policy gates and runtime blockers.
- Audit and metrics.
- Persistence orchestration.
- Safe dry-run integrations.

Inputs:

- Authenticated tenant/actor context.
- Product requests.
- Safe references, never raw phone numbers or secrets.

Outputs:

- Safe response envelopes.
- Audit events.
- Metrics.
- Jobs and integration requests where allowed.

Failure modes:

- Validation denied.
- Policy denied.
- Rate limited.
- Dependency unavailable.
- Integration blocked by safety gates.

### Product Modules

Responsibilities:

- Domain rules.
- Product-specific contracts.
- Product policy.
- Product evals and tests.

Products must not import provider SDKs, network clients, execution services, or unrelated product
verticals.

### Dashboard and Workers

Dashboard is read-only until explicit workflow approvals exist. Workers remain bounded, non-daemon
or controlled until a production worker operating model exists.

## Execution Plane Services

### Dialer Service

Responsibilities:

- Controlled call execution when approved.
- Idempotency enforcement.
- Provider-specific runtime.
- Webhook ingestion.
- Outcome sanitization.

The platform does not call current demo/campaign endpoints directly. All future calls go through
`InternalDialerAdapter` and hardened internal endpoints.

### Future Voice Runtime

May handle specialized voice orchestration if the platform needs runtime isolation from product
logic.

### Future Document Processing

May become a service if imports, OCR, file scanning, malware scanning, or heavy async processing
exceed platform boundaries.

### Future Analytics/Billing

May become a service when reporting load, billing data ownership, or release cadence separates from
product modules.

## Deployment Plane

The deployment plane owns:

- Environments.
- Infrastructure as code.
- Secrets references.
- Release workflows.
- Rollback workflows.
- Operational runbooks.

It must not contain product secrets in plain text or bypass product policy gates.

## Ownership

Every service needs:

- Code owner.
- Runtime owner.
- Security owner.
- Operational runbook owner.
- Contract owner.

No service should enter production without clear owner assignment.
