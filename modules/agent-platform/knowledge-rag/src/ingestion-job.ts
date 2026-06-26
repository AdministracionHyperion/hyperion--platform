import type { Brand } from "../../../../packages/shared/src/core";
import type { KnowledgeBaseId } from "./knowledge-base-id";

export type IngestionJobId = Brand<string, "IngestionJobId">;
export type IngestionJobStatus = "pending" | "running" | "completed" | "failed";

export interface IngestionJob {
  readonly ingestionJobId: IngestionJobId;
  readonly tenantId: string;
  readonly knowledgeBaseId: KnowledgeBaseId;
  readonly status: IngestionJobStatus;
  readonly createdBy: string;
  readonly createdAt: Date;
}
