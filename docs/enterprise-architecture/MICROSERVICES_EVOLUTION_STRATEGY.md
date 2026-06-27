# Microservices Evolution Strategy

## When To Split A Module Into A Service

Split a module only when the operational benefits exceed the coordination cost.

Strong split signals:

- Runtime requirements differ from the platform.
- Scaling profile differs materially.
- Operational risk is high.
- External provider integration is sensitive.
- Deployment cadence differs.
- Ownership differs.
- Data isolation or security isolation is required.
- Heavy asynchronous processing would overload the platform.
- Availability or SLA differs.
- Contract is stable enough to version.

## When Not To Split

Do not split when:

- Domain is unstable.
- Work is simple CRUD.
- Transactional coupling is strong.
- Observability is immature.
- Contract is not stable.
- Team is too small to operate more services.
- Split would create distributed failure modes without real benefit.

## Current Applications

### CEDCO D02

D02 remains a product vertical in `hyperion--platform`. Dialer execution becomes a separate service
because live call execution has provider risk, runtime risk, and a distinct hardening backlog.

### CEDCO D03

D03 remains in the platform. It currently has domain contracts only. DB/API/dashboard/workers should
not split or deploy until the domain is expanded and persistence boundaries are reviewed.

### Billing

Future billing should start in the platform as contracts and rules. Split only if reporting load,
payment provider integration, compliance, or release cadence requires it.

### Document Processing

Document processing is a service candidate if it requires file upload scanning, OCR, long-running
jobs, external providers, storage isolation, or malware controls.

## Governance Before Split

Before creating a new service:

- Define service purpose and owner.
- Define contract and versioning.
- Define data ownership.
- Define security baseline.
- Define observability.
- Define CI/CD.
- Define runbooks.
- Define rollback.
- Add repo guard and architecture guard rules where applicable.
