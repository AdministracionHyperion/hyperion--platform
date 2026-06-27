import {
  domainError,
  fail,
  ok,
  type DomainError,
  type OperationContext,
  type Result,
} from "../../../../../packages/shared/src/core";
import type { CallId } from "../../../voice-core/src/call-id";
import type { CallSessionRepositoryPort } from "../../../voice-core/src/call-session-repository.port";
import type { CallContextLoaderPort } from "../call-context-loader.port";
import type { CallOrchestrationPlan } from "../call-orchestration-plan";

export interface PrepareCallOrchestrationInput {
  readonly context: OperationContext;
  readonly callId: CallId;
  readonly sessionRepository: CallSessionRepositoryPort;
  readonly contextLoader: CallContextLoaderPort;
}

export async function prepareCallOrchestration(
  input: PrepareCallOrchestrationInput,
): Promise<Result<CallOrchestrationPlan, DomainError>> {
  const session = await input.sessionRepository.findById(input.context.tenantId, input.callId);
  if (!session) {
    return fail(domainError("not_found", "call session not found"));
  }

  const callContext = await input.contextLoader.loadContext(input.callId, input.context);
  if (callContext.tenantId !== input.context.tenantId) {
    return fail(domainError("tenant_isolation_violation", "call context tenant mismatch"));
  }

  return ok({
    callId: input.callId,
    tenantId: input.context.tenantId,
    objective: callContext.objective,
    context: callContext,
    preparedAt: input.context.occurredAt,
  });
}
