# CEDCO R02 RAG Approval Flow

Knowledge states:

- `draft`
- `uploaded`
- `processing`
- `ready_for_review`
- `approved`
- `active`
- `archived`
- `failed`

Minimum workflow:

1. Upload a document into draft/uploaded processing.
2. Sanitize and chunk.
3. Review chunks for PII and clinical-risk content.
4. Approve a document version.
5. Activate exactly the reviewed version for agent use.
6. Archive stale or unsafe versions.

Approval must be performed by a role with `r02.knowledge.approve`. External embeddings and real
vector stores require a future approval loop.
