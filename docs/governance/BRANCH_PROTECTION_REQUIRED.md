# Branch Protection Required

Codex no debe configurar branch protection automaticamente. Estas reglas se recomiendan para que el
owner del repositorio las active en GitHub.

## `main`

- Require pull request before merging.
- Require approvals.
- Required checks:
  - `CI / Verify / verify`.
  - `CI / Verify / db-integration`.
  - `CI / Verify / api-integration`.
- Require branch to be up to date before merging.
- Restrict force pushes.
- Restrict deletions.
- Require conversation resolution.
- No direct push to `main`.
- No deploy automatico en esta fase.

## Ramas Foundation

- No force push.
- PR hacia `main` solo con CI verde.
- Mantener commits pequenos y revisables.
- Documentar limites de alcance por loop.

## Nota Operativa

La branch protection debe configurarse en GitHub por un administrador humano. Este repo solo deja la
documentacion y checklist listos.
