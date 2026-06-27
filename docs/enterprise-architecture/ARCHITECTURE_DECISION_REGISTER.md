# Architecture Decision Register

## ADR-001: Control Plane vs Execution Plane

Decision: `hyperion--platform` is the control plane. Specialized services execute high-risk or
high-load work behind contracts.

## ADR-002: Dialer Kept Separate

Decision: dialer source does not live in `hyperion--platform`. The future official execution service
is `hyperion-dialer-service`.

## ADR-003: Products Live In Platform

Decision: CEDCO D02, D03, and future product verticals start in `hyperion--platform` under product
boundaries.

## ADR-004: Contract-First Integrations

Decision: repositories and services connect through explicit contracts, versioning, compatibility
tests, and audit fields.

## ADR-005: No Provider Egress By Default

Decision: provider egress and real calls are blocked unless flags, approvals, runbooks, secret
manager refs, audit, and CI are satisfied.

## ADR-006: Repo Governance And Branch Protection

Decision: `main` requires PRs, status checks, review, no direct push, no force push, and no broad
branch protection bypass.

## ADR-007: D03 Parallel Lane

Decision: D03 can proceed from `main` in domain/tests/docs only until persistence/API/dashboard are
approved.

## ADR-008: Infrastructure As Code Future Repo

Decision: deployment plane should live in future `hyperion-infra`, not mixed into product runtime
until environment governance is ready.
