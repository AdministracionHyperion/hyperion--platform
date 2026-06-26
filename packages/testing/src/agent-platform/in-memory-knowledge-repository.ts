import type { KnowledgeBase } from "../../../../modules/agent-platform/knowledge-rag/src/knowledge-base";
import type { KnowledgeBaseId } from "../../../../modules/agent-platform/knowledge-rag/src/knowledge-base-id";
import type { KnowledgeChunk } from "../../../../modules/agent-platform/knowledge-rag/src/knowledge-chunk";
import type {
  KnowledgeDocument,
  KnowledgeDocumentId,
} from "../../../../modules/agent-platform/knowledge-rag/src/knowledge-document";
import type { KnowledgeRepositoryPort } from "../../../../modules/agent-platform/knowledge-rag/src/knowledge-repository.port";

export class InMemoryKnowledgeRepository implements KnowledgeRepositoryPort {
  private readonly knowledgeBases = new Map<string, KnowledgeBase>();
  private readonly documents = new Map<string, KnowledgeDocument>();
  private readonly chunks: KnowledgeChunk[] = [];

  async saveKnowledgeBase(knowledgeBase: KnowledgeBase): Promise<void> {
    this.knowledgeBases.set(
      key(knowledgeBase.tenantId, knowledgeBase.knowledgeBaseId),
      knowledgeBase,
    );
  }

  async findKnowledgeBase(
    tenantId: string,
    knowledgeBaseId: KnowledgeBaseId,
  ): Promise<KnowledgeBase | null> {
    return this.knowledgeBases.get(key(tenantId, knowledgeBaseId)) ?? null;
  }

  async saveDocument(document: KnowledgeDocument): Promise<void> {
    this.documents.set(key(document.tenantId, document.documentId), document);
  }

  async findDocument(
    tenantId: string,
    documentId: KnowledgeDocumentId,
  ): Promise<KnowledgeDocument | null> {
    return this.documents.get(key(tenantId, documentId)) ?? null;
  }

  async saveChunks(chunks: readonly KnowledgeChunk[]): Promise<void> {
    this.chunks.push(...chunks);
  }

  async findChunksByDocument(
    tenantId: string,
    documentId: KnowledgeDocumentId,
  ): Promise<readonly KnowledgeChunk[]> {
    return this.chunks.filter(
      (chunk) => chunk.tenantId === tenantId && chunk.documentId === documentId,
    );
  }
}

function key(tenantId: string, id: string): string {
  return `${tenantId}:${id}`;
}
