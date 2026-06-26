import {
  fail,
  ok,
  sanitizeMetadata,
  type DomainError,
  type OperationContext,
  type Result,
} from "../../../../../../packages/shared/src/core";
import type { CallContext } from "../../../../../voice/call-orchestration/src";
import type { CallId } from "../../../../../voice/voice-core/src";
import type { CedcoCallObjective } from "../cedco-call-objective";
import type { CedcoD02Configuration } from "../cedco-d02-configuration";

export interface PrepareCedcoD02CallContextInput {
  readonly context: OperationContext;
  readonly configuration: CedcoD02Configuration;
  readonly callId: CallId;
  readonly objective: CedcoCallObjective;
  readonly safeFacts?: Readonly<Record<string, unknown>>;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export function prepareCedcoD02CallContext(
  input: PrepareCedcoD02CallContextInput,
): Result<CallContext, DomainError> {
  if (!input.configuration.activeAgentVersionId) {
    return fail({ code: "invalid_state", message: "activeAgentVersionId is required" });
  }

  if (
    (input.objective === "faq" || input.objective === "orientation") &&
    !input.configuration.activeKnowledgeBaseVersionId
  ) {
    return fail({
      code: "invalid_state",
      message: "activeKnowledgeBaseVersionId is required for CEDCO FAQ/orientation",
    });
  }

  return ok({
    callId: input.callId,
    tenantId: input.context.tenantId,
    agentRuntimeRef: {
      agentVersionId: input.configuration.activeAgentVersionId,
      promptVersionId: input.configuration.activePromptVersionId,
      flowVersionId: input.configuration.activeFlowVersionId,
      knowledgeBaseVersionId: input.configuration.activeKnowledgeBaseVersionId,
    },
    knowledgeRuntimeRef: input.configuration.activeKnowledgeBaseVersionId,
    objective: input.objective,
    safeFacts: sanitizeSafeFacts(input.safeFacts),
    metadata: sanitizeMetadata(input.metadata),
  });
}

function sanitizeSafeFacts(
  safeFacts: Readonly<Record<string, unknown>> = {},
): Readonly<Record<string, string>> {
  const converted: Record<string, string> = {};
  for (const [key, value] of Object.entries(safeFacts)) {
    converted[key] = String(value);
  }
  return converted;
}
