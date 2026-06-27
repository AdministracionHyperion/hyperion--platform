# CI/CD Governance

## Required Checks

`main` requires:

- `verify`.
- `db-integration`.
- `api-integration`.

The checks must stay strict and branch protection must require PRs before merging.

## Branch Protection

Required rules:

- Require pull request before merging.
- Require status checks.
- Require branch up to date when feasible.
- Require review.
- No direct push to `main`.
- No force push.
- No branch deletion.
- Resolve conversations before merge when supported.

## PR Requirements

Every PR should include:

- Summary.
- Scope.
- Safety notes.
- Validation results.
- Explicit statement if docs-only.
- Confirmation of no secrets, no provider egress, no deploy, and no real data when relevant.

## Admin Exception Policy

Admin exceptions are allowed only when operating solo and only to remove required review
temporarily. They must:

- Keep status checks active.
- Be documented in the PR before the change.
- Merge normally, never by direct push.
- Restore required review immediately after merge.
- Add a closing PR comment.
- Verify branch protection after restoration.

Admin exceptions must not disable CI, repo guard, db schema check, branch protection broadly, or
force push.

## Deploy Governance

Deployment requires:

- Approved workflow.
- Environment target.
- Runbook.
- Rollback plan.
- Secret manager references.
- Change record.
- Post-deploy verification.

No deploy is allowed from this docs loop.

## Future CI/CD Work

- Dependency scanning.
- SBOM generation.
- CodeQL or equivalent security scan.
- Release tagging.
- Environment-specific approvals.
- Signed artifacts.
