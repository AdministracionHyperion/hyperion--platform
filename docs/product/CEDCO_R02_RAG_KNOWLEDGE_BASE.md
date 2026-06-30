# CEDCO R02 RAG Knowledge Base

R02 knowledge is versioned, reviewed and activated before agent use.

Implemented baseline:

- Dashboard upload through `GET /api/v1/tenants/:tenantId/r02/dashboard`.
- Knowledge document upload for text-like formats: `txt`, `md`, `csv`, `json`.
- `pdf` and `docx` sources are accepted only as operator-supplied extracted text; the binary file is
  not uploaded or stored.
- Size validation.
- Basic sanitizer for phone-like values, email-like values and provider references.
- Chunking into sanitized text chunks.
- Approval and activation flow.
- Keyword retrieval fallback with source document and version references.

External embeddings are disabled. The current retriever is deterministic keyword retrieval backed by
the R02 operational API and Prisma in staging.

No raw transcripts, audio, phone numbers, DDI, provider IDs or API keys are valid knowledge content.

Operator flow:

1. Open the R02 dashboard for the tenant.
2. Use `Cargar RAG` to submit a text-like source and sanitized content. For PDF/DOCX material, paste
   only extracted/sanitized text and keep the binary file outside the platform.
3. Process, approve and activate the document from the dashboard.
4. Use `Probar busqueda` to confirm source/version results.
5. Bind the active knowledge base to the active R02 agent version through the agent version flow.
