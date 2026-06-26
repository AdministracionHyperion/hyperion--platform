import {
  createCorrelationId,
  fail,
  ok,
  type DomainError,
  type OperationContext,
  type Result,
} from "../../../../../packages/shared/src/core";
import { createKnowledgeBaseId } from "../knowledge-base-id";
import type { KnowledgeRepositoryPort } from "../knowledge-repository.port";
import type { KnowledgeBaseVersion, KnowledgeBaseVersionId } from "../knowledge-base-version";
import type { KnowledgeVersionRepositoryPort } from "../knowledge-version-repository.port";
import { defaultRetrievalPolicy, type RetrievalPolicy } from "../retrieval-policy";

export interface CreateKnowledgeBaseVersionInput {
  readonly context: OperationContext;
  readonly knowledgeRepository: KnowledgeRepositoryPort;
  readonly versionRepository: KnowledgeVersionRepositoryPort;
  readonly knowledgeBaseId: string;
  readonly retrievalPolicy?: RetrievalPolicy;
}

export async function createKnowledgeBaseVersion(
  input: CreateKnowledgeBaseVersionInput,
): Promise<Result<KnowledgeBaseVersion, DomainError>> {
  const knowledgeBaseId = createKnowledgeBaseId(input.knowledgeBaseId);
  if (!knowledgeBaseId.ok) {
    return fail(knowledgeBaseId.error);
  }

  const knowledgeBase = await input.knowledgeRepository.findKnowledgeBase(
    input.context.tenantId,
    knowledgeBaseId.value,
  );
  if (!knowledgeBase) {
    return fail({ code: "not_found", message: "knowledge base not found" });
  }

  const versions = await input.versionRepository.findByKnowledgeBase(
    input.context.tenantId,
    knowledgeBaseId.value,
  );
  const versionNumber = Math.max(0, ...versions.map((version) => version.versionNumber)) + 1;
  const version: KnowledgeBaseVersion = {
    knowledgeBaseVersionId: createKnowledgeBaseVersionId(),
    tenantId: input.context.tenantId,
    knowledgeBaseId: knowledgeBaseId.value,
    versionNumber,
    status: "draft",
    retrievalPolicy: input.retrievalPolicy ?? defaultRetrievalPolicy,
    createdBy: input.context.actorId,
    createdAt: input.context.occurredAt,
  };

  await input.versionRepository.save(version);
  return ok(version);
}

function createKnowledgeBaseVersionId(): KnowledgeBaseVersionId {
  const correlationId = createCorrelationId();
  return (
    correlationId.ok
      ? `knowledge-version-${correlationId.value}`
      : `knowledge-version-${Date.now()}`
  ) as KnowledgeBaseVersionId;
}
