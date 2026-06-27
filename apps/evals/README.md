# Hyperion Evals

`apps/evals` contains local deterministic evaluation entry points. The CEDCO D02 suite uses
TypeScript domain fixtures and Vitest, not a real LLM, provider, database or voice runtime.

Run locally:

```powershell
pnpm evals:cedco-d02
pnpm test:evals
```

The wrapper CLI delegates to the TypeScript eval tests so the current monorepo can execute evals
without adding a runtime transpiler.
