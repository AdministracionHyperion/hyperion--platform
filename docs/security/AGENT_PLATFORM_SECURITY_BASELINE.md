# Agent Platform Security Baseline

## Tenant isolation

Todas las entidades principales incluyen `tenantId`. Los repositorios y use cases operan con el
`tenantId` de `OperationContext`.

Retrieval rechaza acceso cross-tenant y `RetrievalPolicy.allowCrossTenant` queda en `false` por
defecto.

## RBAC

Los use cases de escritura de agentes y prompts integran RBAC via `ActorContext` y permisos de Core:

- `agent:write` para crear agentes, versiones y deploys permitidos.
- `version:activate` o `agent:write` para activar versiones de agente.

Los roles de solo lectura, como `tenant-viewer`, no pueden crear agentes.

## Audit log

Los use cases principales aceptan `AuditLogPort` cuando aplica y registran eventos sanitizados. El
dominio no exige una implementacion concreta de audit log.

## Metadata sanitization

Agent, KnowledgeDocument, KnowledgeChunk, EvalResult y otros payloads sanitizan metadata con
`SafeMetadata`.

Claves sensibles como phone, email, token, apiKey, rawTranscript, audioUrl y recordingUrl se
redactan.

## No PII by default

El dominio no requiere telefonos reales, emails reales, documentos reales, pacientes reales,
transcripts crudos ni audio crudo.

Prompt preview esta pensado para datos sinteticos y rechaza claves sensibles.

## Prompt policy

`PromptPolicy` bloquea por defecto:

- PII/PHI cruda.
- Secrets.
- API keys de proveedores.
- Telefonos hardcodeados.
- Datos reales de pacientes.

## Knowledge isolation

Knowledge/RAG no lee archivos reales, no ingiere `_private/`, no crea embeddings reales y no usa
vector DB. Los documentos registrados en tests son sinteticos.

## Eval policy

Evals no llama LLM real. Policy violations pueden producir feedback sanitizado para revision
posterior.

## No secrets

No hay API keys, tokens reales, agent IDs reales, phone number IDs reales, numeros reales ni `.env`
con secretos. `secret:scan` sigue dentro de `pnpm check`.
