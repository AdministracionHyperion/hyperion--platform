import type { KnowledgeBaseId } from "./knowledge-base-id";
import type { KnowledgeBaseVersion, KnowledgeBaseVersionId } from "./knowledge-base-version";

export interface KnowledgeVersionRepositoryPort {
  save(version: KnowledgeBaseVersion): Promise<void>;
  findById(
    tenantId: string,
    knowledgeBaseVersionId: KnowledgeBaseVersionId,
  ): Promise<KnowledgeBaseVersion | null>;
  findByKnowledgeBase(
    tenantId: string,
    knowledgeBaseId: KnowledgeBaseId,
  ): Promise<readonly KnowledgeBaseVersion[]>;
}
