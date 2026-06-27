import type { KnowledgeChunk } from "../../../../modules/agent-platform/knowledge-rag/src/knowledge-chunk";
import type { RetrievalProviderPort } from "../../../../modules/agent-platform/knowledge-rag/src/retrieval-provider.port";
import type { RetrievalPolicy } from "../../../../modules/agent-platform/knowledge-rag/src/retrieval-policy";

export class FakeRetrievalProvider implements RetrievalProviderPort {
  constructor(private readonly chunks: readonly KnowledgeChunk[]) {}

  async retrieve(input: {
    readonly tenantId: string;
    readonly query: string;
    readonly policy: RetrievalPolicy;
  }): Promise<readonly KnowledgeChunk[]> {
    const query = input.query.toLowerCase();
    return this.chunks
      .filter((chunk) => chunk.tenantId === input.tenantId)
      .filter((chunk) => chunk.text.toLowerCase().includes(query) || query.length === 0)
      .slice(0, input.policy.topK);
  }
}
