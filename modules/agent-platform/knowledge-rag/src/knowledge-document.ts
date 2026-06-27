import type { Brand, SafeMetadata } from "../../../../packages/shared/src/core";
import type { KnowledgeBaseId } from "./knowledge-base-id";

export type KnowledgeDocumentId = Brand<string, "KnowledgeDocumentId">;
export type KnowledgeDocumentSourceType = "manual" | "file" | "url" | "integration";
export type KnowledgeDocumentStatus = "draft" | "indexed" | "rejected" | "archived";

export interface KnowledgeDocument {
  readonly documentId: KnowledgeDocumentId;
  readonly tenantId: string;
  readonly knowledgeBaseId: KnowledgeBaseId;
  readonly title: string;
  readonly sourceType: KnowledgeDocumentSourceType;
  readonly status: KnowledgeDocumentStatus;
  readonly metadata: SafeMetadata;
  readonly createdBy: string;
  readonly createdAt: Date;
}
