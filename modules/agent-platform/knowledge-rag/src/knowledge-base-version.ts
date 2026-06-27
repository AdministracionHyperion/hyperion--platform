import type { Brand } from "../../../../packages/shared/src/core";
import type { KnowledgeBaseId } from "./knowledge-base-id";
import type { RetrievalPolicy } from "./retrieval-policy";

export type KnowledgeBaseVersionId = Brand<string, "KnowledgeBaseVersionId">;
export type KnowledgeBaseVersionStatus = "draft" | "active" | "archived";

export interface KnowledgeBaseVersion {
  readonly knowledgeBaseVersionId: KnowledgeBaseVersionId;
  readonly tenantId: string;
  readonly knowledgeBaseId: KnowledgeBaseId;
  readonly versionNumber: number;
  readonly status: KnowledgeBaseVersionStatus;
  readonly retrievalPolicy: RetrievalPolicy;
  readonly createdBy: string;
  readonly createdAt: Date;
  readonly activatedAt?: Date;
}
