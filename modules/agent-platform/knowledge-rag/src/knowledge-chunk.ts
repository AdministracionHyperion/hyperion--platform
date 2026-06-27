import type { Brand, SafeMetadata } from "../../../../packages/shared/src/core";
import type { KnowledgeDocumentId } from "./knowledge-document";

export type KnowledgeChunkId = Brand<string, "KnowledgeChunkId">;

export interface KnowledgeChunk {
  readonly chunkId: KnowledgeChunkId;
  readonly tenantId: string;
  readonly documentId: KnowledgeDocumentId;
  readonly text: string;
  readonly ordinal: number;
  readonly metadata: SafeMetadata;
}
