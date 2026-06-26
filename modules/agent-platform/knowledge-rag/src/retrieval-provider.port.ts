import type { KnowledgeChunk } from "./knowledge-chunk";
import type { RetrievalPolicy } from "./retrieval-policy";

export interface RetrievalProviderPort {
  retrieve(input: {
    readonly tenantId: string;
    readonly query: string;
    readonly policy: RetrievalPolicy;
  }): Promise<readonly KnowledgeChunk[]>;
}
