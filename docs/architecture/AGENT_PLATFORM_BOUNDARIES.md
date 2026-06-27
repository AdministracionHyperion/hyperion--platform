# Agent Platform Boundaries

## Reglas de dependencia

- Agent Platform no depende de productos.
- Agent Platform no depende de proveedores.
- Agent Platform no importa `modules/integrations/provider-adapters`.
- Agent Platform no llama LLM real.
- Agent Platform no genera embeddings reales.
- Agent Platform no lee documentos privados.
- CEDCO D02 usara Agent Platform; Agent Platform no depende de CEDCO.

## Dependencias permitidas

Agent Platform puede depender de:

- `packages/shared`.
- `modules/core` para contexto, RBAC, audit, events y feedback.
- Puertos definidos dentro del propio dominio Agent Platform.

## Dependencias prohibidas en esta fase

- `modules/products/*`.
- `modules/integrations/provider-adapters`.
- ElevenLabs.
- OpenAI.
- Anthropic.
- Twilio.
- PBX/SIP adapters.
- Vector DBs reales.
- Filesystem para ingestion real.
- `_private/`.
- `process.env`.

## Knowledge/RAG

Knowledge/RAG solo define contratos y use cases de dominio. `EmbeddingProviderPort` y
`RetrievalProviderPort` existen para loops posteriores. Los fakes viven en `packages/testing` y no
son produccion.

## Evals

Evals define escenarios, runs, resultados y summary. `EvalRunnerPort` existe como contrato, pero no
hay LLM real ni proveedor externo.

## Boundary guard

`tools/boundary-check.mjs` valida estas reglas de forma estatica:

- `modules/agent-platform` no importa productos.
- `modules/agent-platform` no importa provider adapters.
- `modules/agent-platform` no importa proveedores reales.
- `modules/agent-platform` no usa `process.env`.
- `modules/agent-platform` no menciona `_private`.
- `knowledge-rag` no importa vector DB real.
- `evals` no importa LLM real.

El guard se ejecuta con `pnpm run architecture:check` y dentro de `pnpm check`.
