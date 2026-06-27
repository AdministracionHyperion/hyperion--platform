import {
  domainError,
  fail,
  ok,
  type DomainError,
  type OperationContext,
  type Result,
} from "../../../../../packages/shared/src/core";
import type { PromptVersion, PromptVersionId } from "../prompt-version";
import type { PromptVersionRepositoryPort } from "../prompt-version-repository.port";

export interface ActivatePromptVersionInput {
  readonly context: OperationContext;
  readonly repository: PromptVersionRepositoryPort;
  readonly promptVersionId: PromptVersionId;
}

export async function activatePromptVersion(
  input: ActivatePromptVersionInput,
): Promise<Result<PromptVersion, DomainError>> {
  const target = await input.repository.findById(input.context.tenantId, input.promptVersionId);
  if (!target) {
    return fail(domainError("not_found", "prompt version not found"));
  }

  const versions = await input.repository.findByPrompt(input.context.tenantId, target.promptId);
  for (const version of versions) {
    if (version.status === "active" && version.promptVersionId !== target.promptVersionId) {
      await input.repository.save({ ...version, status: "archived" });
    }
  }

  const activated: PromptVersion = {
    ...target,
    status: "active",
    activatedAt: input.context.occurredAt,
  };
  await input.repository.save(activated);
  return ok(activated);
}
