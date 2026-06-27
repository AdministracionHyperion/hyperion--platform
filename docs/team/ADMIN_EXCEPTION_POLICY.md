# Admin Exception Policy

## Purpose

This policy documents the narrow solo-operator exception used when GitHub requires a human review
but no second reviewer is available.

## Allowed Exception

Only this temporary action is allowed:

1. Confirm PR is mergeable and CI is green.
2. Capture current branch protection.
3. Comment on the PR before the exception.
4. Temporarily remove required pull request reviews only.
5. Keep required status checks active.
6. Merge normally through GitHub.
7. Restore required pull request reviews immediately.
8. Verify branch protection.
9. Comment that the exception is closed.

## Not Allowed

- Direct push to `main`.
- Force push.
- CI disablement.
- Status check removal.
- Broad branch protection removal.
- Deploy.
- Provider egress.
- Runtime changes hidden as governance.

## Required Final Evidence

- PR number.
- CI status.
- Merge commit.
- Required review count after restore.
- Required checks after restore.
- Final git status.
