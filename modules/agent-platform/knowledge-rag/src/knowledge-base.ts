import type { KnowledgeBaseId } from "./knowledge-base-id";

export interface KnowledgeBase {
  readonly knowledgeBaseId: KnowledgeBaseId;
  readonly tenantId: string;
  readonly name: string;
  readonly description: string;
  readonly createdBy: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
