# CEDCO R02 RAG Knowledge Base

R02 knowledge is versioned, reviewed and activated before agent use.

Implemented baseline:

- Knowledge document upload for text-like formats: `txt`, `md`, `csv`, `json`.
- `pdf` and `docx` return `extractor_required` until a safe extractor is approved.
- Size validation.
- Basic sanitizer for phone-like values, email-like values and provider references.
- Chunking into sanitized text chunks.
- Approval and activation flow.
- Keyword retrieval fallback with source document and version references.

External embeddings are disabled. The current retriever is deterministic and in-memory for
foundation tests.

No raw transcripts, audio, phone numbers, DDI, provider IDs or API keys are valid knowledge content.
