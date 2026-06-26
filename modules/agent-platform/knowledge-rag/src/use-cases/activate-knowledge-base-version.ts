import {
  domainError,
  fail,
  ok,
  type DomainError,
  type OperationContext,
  type Result,
} from "../../../../../packages/shared/src/core";
import type { KnowledgeBaseVersion, KnowledgeBaseVersionId } from "../knowledge-base-version";
import type { KnowledgeVersionRepositoryPort } from "../knowledge-version-repository.port";

export interface ActivateKnowledgeBaseVersionInput {
  readonly context: OperationContext;
  readonly repository: KnowledgeVersionRepositoryPort;
  readonly knowledgeBaseVersionId: KnowledgeBaseVersionId;
}

export async function activateKnowledgeBaseVersion(
  input: ActivateKnowledgeBaseVersionInput,
): Promise<Result<KnowledgeBaseVersion, DomainError>> {
  const target = await input.repository.findById(
    input.context.tenantId,
    input.knowledgeBaseVersionId,
  );
  if (!target) {
    return fail(domainError("not_found", "knowledge base version not found"));
  }

  const versions = await input.repository.findByKnowledgeBase(
    input.context.tenantId,
    target.knowledgeBaseId,
  );
  for (const version of versions) {
    if (
      version.status === "active" &&
      version.knowledgeBaseVersionId !== target.knowledgeBaseVersionId
    ) {
      await input.repository.save({ ...version, status: "archived" });
    }
  }

  const activated: KnowledgeBaseVersion = {
    ...target,
    status: "active",
    activatedAt: input.context.occurredAt,
  };
  await input.repository.save(activated);
  return ok(activated);
}
