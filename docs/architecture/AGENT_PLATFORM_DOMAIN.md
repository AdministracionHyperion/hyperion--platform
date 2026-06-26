# Agent Platform Domain

## Proposito

Agent Platform Domain es la capa transversal para construir, versionar, validar y preparar agentes
reutilizables de Hyperion. CEDCO D02 y futuros productos deben componer esta capa, no modificarla ni
introducir dependencias inversas.

Este loop implementa dominio y contratos. No implementa persistencia real, API HTTP, dashboard,
workers, voice runtime, llamadas, LLM real, embeddings reales, vector DB ni proveedores externos.

## Agent Builder

Modulo: `modules/agent-platform/agent-builder`.

Entidades:

- `Agent`.
- `AgentVersion`.
- `AgentDeployment`.
- `AgentEnvironment`.
- `AgentCapability`.
- `AgentToolBinding`.

Puertos:

- `AgentRepositoryPort`.
- `AgentVersionRepositoryPort`.

Use cases:

- `createAgent`.
- `createAgentVersion`.
- `activateAgentVersion`.
- `deployAgentVersion`.

Reglas principales:

- `AgentId` usa formato seguro lowercase con numeros y guiones.
- `CreateAgent` requiere `agent:write`.
- `AgentVersion` se crea como draft y no se activa automaticamente.
- Solo una version queda active por `tenantId + agentId`.
- Production deploy esta bloqueado por politica en esta fase.
- Capabilities deben ser explicitas; no hay wildcard.

## Prompt Management

Modulo: `modules/agent-platform/prompt-management`.

Entidades:

- `PromptTemplate`.
- `PromptVersion`.
- `PromptVariable`.
- `PromptPolicy`.
- `PromptScope`.

Puertos:

- `PromptRepositoryPort`.
- `PromptVersionRepositoryPort`.

Use cases:

- `createPromptTemplate`.
- `createPromptVersion`.
- `activatePromptVersion`.
- `renderPromptPreview`.

Reglas principales:

- `PromptId` usa formato seguro.
- Una sola `PromptVersion` activa por `tenantId + promptId`.
- La politica de prompt rechaza secrets, provider keys, telefonos hardcodeados y datos reales
  evidentes.
- `renderPromptPreview` opera solo con datos sinteticos y no llama LLM real.

## Flow Management

Modulo: `modules/agent-platform/flow-management`.

Entidades:

- `FlowDefinition`.
- `FlowVersion`.
- `FlowNode`.
- `FlowTransition`.
- `FlowPolicy`.

Puertos:

- `FlowRepositoryPort`.
- `FlowVersionRepositoryPort`.

Use cases:

- `createFlowDefinition`.
- `createFlowVersion`.
- `validateFlowGraph`.
- `activateFlowVersion`.

Reglas principales:

- Exactamente un node `start`.
- Al menos un node `end`.
- Transitions solo apuntan a nodos existentes.
- Tool nodes requieren capability explicita.
- Handoff nodes deben estar marcados.
- Se rechazan caminos sin salida obvia.
- Una sola version activa por `tenantId + flowId`.

## Knowledge/RAG

Modulo: `modules/agent-platform/knowledge-rag`.

Entidades:

- `KnowledgeBase`.
- `KnowledgeBaseVersion`.
- `KnowledgeDocument`.
- `KnowledgeChunk`.
- `RetrievalPolicy`.
- `IngestionJob`.

Puertos:

- `KnowledgeRepositoryPort`.
- `KnowledgeVersionRepositoryPort`.
- `EmbeddingProviderPort`.
- `RetrievalProviderPort`.

Use cases:

- `createKnowledgeBase`.
- `createKnowledgeBaseVersion`.
- `registerKnowledgeDocument`.
- `chunkKnowledgeDocument`.
- `activateKnowledgeBaseVersion`.
- `retrieveKnowledgeContext`.

Reglas principales:

- `allowCrossTenant` es `false` por defecto y por tipo.
- `citeSources` es `true` por defecto.
- No hay embeddings reales.
- No hay vector DB real.
- No hay ingestion de documentos reales.
- No se lee `_private/source-docs`.
- Metadata de documentos y chunks se sanitiza.

## Evals

Modulo: `modules/agent-platform/evals`.

Entidades:

- `EvalScenario`.
- `EvalCriterion`.
- `EvalRun`.
- `EvalResult`.
- `EvalFinding`.

Puertos:

- `EvalRepositoryPort`.
- `EvalRunRepositoryPort`.
- `EvalRunnerPort`.

Use cases:

- `createEvalScenario`.
- `startEvalRun`.
- `recordEvalResult`.
- `summarizeEvalRun`.

Reglas principales:

- No usa LLM real.
- `EvalRunnerPort` es un contrato; los tests usan fake.
- `EvalResult` sanitiza metadata.
- Policy violations pueden alimentar `FeedbackRepositoryPort` si se inyecta.
- `summarizeEvalRun` calcula passed, failed, needs_review y score promedio.

## Integracion con Core Platform

Agent Platform reutiliza:

- `OperationContext`.
- `SafeMetadata`.
- `Result`.
- `TenantId`/tenant isolation por `tenantId`.
- `ActorContext` y RBAC.
- `AuditLogPort` cuando aplica.
- `EventBusPort` cuando aplica.
- `FeedbackRepositoryPort` para evals con policy violation.

## Conexion futura con Voice y CEDCO D02

Voice podra consumir agentes, prompts, flows, knowledge bases y evals versionados.

CEDCO D02 podra componer:

- AgentVersion activa.
- PromptVersion activa.
- FlowVersion activa.
- KnowledgeBaseVersion activa.
- Evals aprobados.

CEDCO no debe introducir dependencias inversas hacia Agent Platform.

## Todavia no existe

- Persistencia real.
- Prisma/PostgreSQL.
- API HTTP.
- Dashboard.
- Workers reales.
- Voice runtime.
- CEDCO D02 runtime.
- Llamadas.
- ElevenLabs adapter.
- SIP real.
- LLM real.
- Embeddings reales.
- Vector DB.
- Smoke tests.
