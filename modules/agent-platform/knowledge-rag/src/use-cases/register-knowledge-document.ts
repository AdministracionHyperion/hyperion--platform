import {
  createCorrelationId,
  domainError,
  fail,
  ok,
  sanitizeMetadata,
  type DomainError,
  type OperationContext,
  type Result,
} from "../../../../../packages/shared/src/core";
import { createKnowledgeBaseId } from "../knowledge-base-id";
import type {
  KnowledgeDocument,
  KnowledgeDocumentId,
  KnowledgeDocumentSourceType,
} from "../knowledge-document";
import type { KnowledgeRepositoryPort } from "../knowledge-repository.port";

export interface RegisterKnowledgeDocumentInput {
  readonly context: OperationContext;
  readonly repository: KnowledgeRepositoryPort;
  readonly knowledgeBaseId: string;
  readonly title: string;
  readonly sourceType: KnowledgeDocumentSourceType;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export async function registerKnowledgeDocument(
  input: RegisterKnowledgeDocumentInput,
): Promise<Result<KnowledgeDocument, DomainError>> {
  const knowledgeBaseId = createKnowledgeBaseId(input.knowledgeBaseId);
  if (!knowledgeBaseId.ok) {
    return fail(knowledgeBaseId.error);
  }

  const knowledgeBase = await input.repository.findKnowledgeBase(
    input.context.tenantId,
    knowledgeBaseId.value,
  );
  if (!knowledgeBase) {
    return fail(domainError("not_found", "knowledge base not found"));
  }

  const document: KnowledgeDocument = {
    documentId: createKnowledgeDocumentId(),
    tenantId: input.context.tenantId,
    knowledgeBaseId: knowledgeBaseId.value,
    title: input.title,
    sourceType: input.sourceType,
    status: "draft",
    metadata: sanitizeMetadata(input.metadata),
    createdBy: input.context.actorId,
    createdAt: input.context.occurredAt,
  };

  await input.repository.saveDocument(document);
  return ok(document);
}

function createKnowledgeDocumentId(): KnowledgeDocumentId {
  const correlationId = createCorrelationId();
  return (
    correlationId.ok
      ? `knowledge-document-${correlationId.value}`
      : `knowledge-document-${Date.now()}`
  ) as KnowledgeDocumentId;
}
