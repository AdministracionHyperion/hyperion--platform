import {
  createCorrelationId,
  domainError,
  fail,
  ok,
  sanitizeMetadata,
  type DomainError,
  type OperationContext,
  type Result,
} from "../../../../../packages/shared/src/core";
import type { KnowledgeChunk, KnowledgeChunkId } from "../knowledge-chunk";
import type { KnowledgeDocumentId } from "../knowledge-document";
import type { KnowledgeRepositoryPort } from "../knowledge-repository.port";

export interface ChunkKnowledgeDocumentInput {
  readonly context: OperationContext;
  readonly repository: KnowledgeRepositoryPort;
  readonly documentId: KnowledgeDocumentId;
  readonly text: string;
  readonly chunkSize?: number;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export async function chunkKnowledgeDocument(
  input: ChunkKnowledgeDocumentInput,
): Promise<Result<readonly KnowledgeChunk[], DomainError>> {
  const document = await input.repository.findDocument(input.context.tenantId, input.documentId);
  if (!document) {
    return fail(domainError("not_found", "knowledge document not found"));
  }

  const normalized = input.text.trim();
  if (normalized.length === 0) {
    return fail(domainError("invalid_state", "document text must not be empty"));
  }

  const chunkSize = input.chunkSize ?? 500;
  const chunks: KnowledgeChunk[] = [];
  for (let offset = 0; offset < normalized.length; offset += chunkSize) {
    chunks.push({
      chunkId: createKnowledgeChunkId(chunks.length + 1),
      tenantId: input.context.tenantId,
      documentId: input.documentId,
      text: normalized.slice(offset, offset + chunkSize),
      ordinal: chunks.length + 1,
      metadata: sanitizeMetadata(input.metadata),
    });
  }

  await input.repository.saveChunks(chunks);
  return ok(chunks);
}

function createKnowledgeChunkId(ordinal: number): KnowledgeChunkId {
  const correlationId = createCorrelationId();
  return (
    correlationId.ok
      ? `knowledge-chunk-${ordinal}-${correlationId.value}`
      : `knowledge-chunk-${ordinal}`
  ) as KnowledgeChunkId;
}
