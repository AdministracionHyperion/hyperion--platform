import type { KnowledgeBase } from "./knowledge-base";
import type { KnowledgeBaseId } from "./knowledge-base-id";
import type { KnowledgeChunk } from "./knowledge-chunk";
import type { KnowledgeDocument, KnowledgeDocumentId } from "./knowledge-document";

export interface KnowledgeRepositoryPort {
  saveKnowledgeBase(knowledgeBase: KnowledgeBase): Promise<void>;
  findKnowledgeBase(
    tenantId: string,
    knowledgeBaseId: KnowledgeBaseId,
  ): Promise<KnowledgeBase | null>;
  saveDocument(document: KnowledgeDocument): Promise<void>;
  findDocument(
    tenantId: string,
    documentId: KnowledgeDocumentId,
  ): Promise<KnowledgeDocument | null>;
  saveChunks(chunks: readonly KnowledgeChunk[]): Promise<void>;
  findChunksByDocument(
    tenantId: string,
    documentId: KnowledgeDocumentId,
  ): Promise<readonly KnowledgeChunk[]>;
}
