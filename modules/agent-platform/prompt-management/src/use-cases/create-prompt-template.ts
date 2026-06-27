import {
  domainError,
  fail,
  ok,
  type DomainError,
  type OperationContext,
  type Result,
} from "../../../../../packages/shared/src/core";
import type { AuditLogPort } from "../../../../core/audit/src/audit-log.port";
import { recordAuditEvent } from "../../../../core/audit/src/use-cases/record-audit-event";
import type { ActorContext } from "../../../../core/identity-access/src/actor-context";
import { authorizeActorAction } from "../../../../core/identity-access/src/use-cases/authorize-actor-action";
import { createPromptId } from "../prompt-id";
import type { PromptRepositoryPort } from "../prompt-repository.port";
import type { PromptScope } from "../prompt-scope";
import type { PromptTemplate } from "../prompt-template";

export interface CreatePromptTemplateInput {
  readonly context: OperationContext;
  readonly actor: ActorContext;
  readonly repository: PromptRepositoryPort;
  readonly promptId: string;
  readonly name: string;
  readonly description: string;
  readonly scope: PromptScope;
  readonly auditLog?: AuditLogPort;
}

export async function createPromptTemplate(
  input: CreatePromptTemplateInput,
): Promise<Result<PromptTemplate, DomainError>> {
  const authorization = authorizeActorAction({
    actor: input.actor,
    context: input.context,
    permission: "agent:write",
  });
  if (!authorization.ok) {
    return fail(authorization.error);
  }

  const promptId = createPromptId(input.promptId);
  if (!promptId.ok) {
    return fail(promptId.error);
  }

  if (input.name.trim().length === 0) {
    return fail(domainError("invalid_state", "prompt name must not be empty"));
  }

  const template: PromptTemplate = {
    promptId: promptId.value,
    tenantId: input.context.tenantId,
    name: input.name,
    description: input.description,
    scope: input.scope,
    createdBy: input.context.actorId,
    createdAt: input.context.occurredAt,
    updatedAt: input.context.occurredAt,
  };

  await input.repository.save(template);

  if (input.auditLog) {
    await recordAuditEvent(input.auditLog, {
      context: input.context,
      action: "prompt.created",
      resourceType: "prompt",
      resourceId: template.promptId,
      result: "success",
      metadata: { promptId: template.promptId, scope: template.scope },
    });
  }

  return ok(template);
}
