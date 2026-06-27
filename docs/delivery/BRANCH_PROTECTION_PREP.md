# Branch Protection Prep

Este documento prepara las reglas recomendadas para GitHub. No se configuran automaticamente desde
este loop.

## main

Cuando se active branch protection para `main`, se recomienda:

- Require pull request before merging.
- Require approvals.
- Require status checks.
- Required status check: `CI / Verify`.
- Require branch to be up to date before merging.
- Restrict force pushes.
- Restrict deletions.
- Require conversation resolution.
- No direct push a `main`.
- No deploy automatico en esta fase.

## foundation branches

Para ramas `foundation/**`:

- No force push.
- PR hacia `main` solo con CI verde.
- Mantener commits pequenos y revisables.
- No mezclar loops de dominio, persistencia, runtime y deploy en un mismo PR.

## Fuera de alcance

No se crean secrets de GitHub, no se configura deploy, no se activa proteccion automaticamente y no
se hacen cambios de administracion remota.
