import type { KnowledgeBaseId } from "../../../../modules/agent-platform/knowledge-rag/src/knowledge-base-id";
import type {
  KnowledgeBaseVersion,
  KnowledgeBaseVersionId,
} from "../../../../modules/agent-platform/knowledge-rag/src/knowledge-base-version";
import type { KnowledgeVersionRepositoryPort } from "../../../../modules/agent-platform/knowledge-rag/src/knowledge-version-repository.port";

export class InMemoryKnowledgeVersionRepository implements KnowledgeVersionRepositoryPort {
  private readonly versions = new Map<string, KnowledgeBaseVersion>();

  async save(version: KnowledgeBaseVersion): Promise<void> {
    this.versions.set(key(version.tenantId, version.knowledgeBaseVersionId), version);
  }

  async findById(
    tenantId: string,
    knowledgeBaseVersionId: KnowledgeBaseVersionId,
  ): Promise<KnowledgeBaseVersion | null> {
    return this.versions.get(key(tenantId, knowledgeBaseVersionId)) ?? null;
  }

  async findByKnowledgeBase(
    tenantId: string,
    knowledgeBaseId: KnowledgeBaseId,
  ): Promise<readonly KnowledgeBaseVersion[]> {
    return [...this.versions.values()].filter(
      (version) => version.tenantId === tenantId && version.knowledgeBaseId === knowledgeBaseId,
    );
  }
}

function key(tenantId: string, id: string): string {
  return `${tenantId}:${id}`;
}
