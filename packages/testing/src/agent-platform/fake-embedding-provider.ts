import type { EmbeddingProviderPort } from "../../../../modules/agent-platform/knowledge-rag/src/embedding-provider.port";

export class FakeEmbeddingProvider implements EmbeddingProviderPort {
  async embedText(_tenantId: string, text: string): Promise<readonly number[]> {
    return [text.length, text.split(/\s+/u).filter(Boolean).length];
  }
}
