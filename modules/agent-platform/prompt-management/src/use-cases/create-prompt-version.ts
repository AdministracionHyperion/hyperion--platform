import {
  createCorrelationId,
  fail,
  ok,
  type DomainError,
  type OperationContext,
  type Result,
} from "../../../../../packages/shared/src/core";
import { defaultPromptPolicy, validatePromptPolicy } from "../prompt-policy";
import { createPromptId } from "../prompt-id";
import type { PromptRepositoryPort } from "../prompt-repository.port";
import type { PromptVariable } from "../prompt-variable";
import type { PromptVersion, PromptVersionId } from "../prompt-version";
import type { PromptVersionRepositoryPort } from "../prompt-version-repository.port";

export interface CreatePromptVersionInput {
  readonly context: OperationContext;
  readonly promptRepository: PromptRepositoryPort;
  readonly versionRepository: PromptVersionRepositoryPort;
  readonly promptId: string;
  readonly template: string;
  readonly variables: readonly PromptVariable[];
}

export async function createPromptVersion(
  input: CreatePromptVersionInput,
): Promise<Result<PromptVersion, DomainError>> {
  const promptId = createPromptId(input.promptId);
  if (!promptId.ok) {
    return fail(promptId.error);
  }

  const prompt = await input.promptRepository.findById(input.context.tenantId, promptId.value);
  if (!prompt) {
    return fail({ code: "not_found", message: "prompt template not found" });
  }

  const policy = validatePromptPolicy(input.template);
  if (!policy.ok) {
    return fail(policy.error);
  }

  const versions = await input.versionRepository.findByPrompt(
    input.context.tenantId,
    promptId.value,
  );
  const versionNumber = Math.max(0, ...versions.map((version) => version.versionNumber)) + 1;
  const version: PromptVersion = {
    promptVersionId: createPromptVersionId(),
    tenantId: input.context.tenantId,
    promptId: promptId.value,
    versionNumber,
    status: "draft",
    template: input.template,
    variables: input.variables,
    policy: defaultPromptPolicy,
    createdBy: input.context.actorId,
    createdAt: input.context.occurredAt,
  };

  await input.versionRepository.save(version);
  return ok(version);
}

function createPromptVersionId(): PromptVersionId {
  const correlationId = createCorrelationId();
  return (
    correlationId.ok ? `prompt-version-${correlationId.value}` : `prompt-version-${Date.now()}`
  ) as PromptVersionId;
}
