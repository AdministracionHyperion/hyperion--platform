import {
  domainError,
  fail,
  ok,
  type DomainError,
  type OperationContext,
  type Result,
} from "../../../../../packages/shared/src/core";
import { createKnowledgeBaseId } from "../knowledge-base-id";
import type { KnowledgeBase } from "../knowledge-base";
import type { KnowledgeRepositoryPort } from "../knowledge-repository.port";

export interface CreateKnowledgeBaseInput {
  readonly context: OperationContext;
  readonly repository: KnowledgeRepositoryPort;
  readonly knowledgeBaseId: string;
  readonly name: string;
  readonly description: string;
}

export async function createKnowledgeBase(
  input: CreateKnowledgeBaseInput,
): Promise<Result<KnowledgeBase, DomainError>> {
  const knowledgeBaseId = createKnowledgeBaseId(input.knowledgeBaseId);
  if (!knowledgeBaseId.ok) {
    return fail(knowledgeBaseId.error);
  }

  if (input.name.trim().length === 0) {
    return fail(domainError("invalid_state", "knowledge base name must not be empty"));
  }

  const knowledgeBase: KnowledgeBase = {
    knowledgeBaseId: knowledgeBaseId.value,
    tenantId: input.context.tenantId,
    name: input.name,
    description: input.description,
    createdBy: input.context.actorId,
    createdAt: input.context.occurredAt,
    updatedAt: input.context.occurredAt,
  };

  await input.repository.saveKnowledgeBase(knowledgeBase);
  return ok(knowledgeBase);
}
