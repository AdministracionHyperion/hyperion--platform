import {
  validateSafeIdentifier,
  type Brand,
  type DomainError,
  type Result,
} from "../../../../packages/shared/src/core";

export type KnowledgeBaseId = Brand<string, "KnowledgeBaseId">;

export function createKnowledgeBaseId(value: string): Result<KnowledgeBaseId, DomainError> {
  const validated = validateSafeIdentifier(value, "knowledgeBaseId");
  return validated.ok ? { ok: true, value: validated.value as KnowledgeBaseId } : validated;
}
