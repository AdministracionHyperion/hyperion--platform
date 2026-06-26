import {
  domainError,
  fail,
  ok,
  type DomainError,
  type OperationContext,
  type Result,
} from "../../../../../packages/shared/src/core";
import type { CallId } from "../../../voice-core/src/call-id";
import type { CallEventRepositoryPort } from "../../../voice-core/src/call-event-repository.port";
import type { CallSessionRepositoryPort } from "../../../voice-core/src/call-session-repository.port";
import { recordConversationTurn } from "../../../voice-core/src/use-cases/record-conversation-turn";
import { registerCallEvent } from "../../../voice-core/src/use-cases/register-call-event";
import type { TurnDecision } from "../turn-decision";

export interface ApplyTurnDecisionInput {
  readonly context: OperationContext;
  readonly callId: CallId;
  readonly decision: TurnDecision;
  readonly sessionRepository: CallSessionRepositoryPort;
  readonly eventRepository: CallEventRepositoryPort;
}

export async function applyTurnDecision(
  input: ApplyTurnDecisionInput,
): Promise<Result<true, DomainError>> {
  if (input.decision.action === "respond" || input.decision.action === "ask_clarifying_question") {
    const turn = await recordConversationTurn({
      context: input.context,
      repository: input.sessionRepository,
      callId: input.callId,
      role: "agent",
      contentRedacted: input.decision.responseTextRedacted ?? "",
      metadata: input.decision.metadata,
    });
    if (!turn.ok) {
      return fail(turn.error);
    }
  }

  if (input.decision.action === "handoff" && !input.decision.handoffReason) {
    return fail(domainError("invalid_state", "handoff decision requires reason"));
  }

  await registerCallEvent({
    context: input.context,
    repository: input.eventRepository,
    callId: input.callId,
    type: `call.turn_decision.${input.decision.action}`,
    metadata: input.decision.metadata,
  });

  return ok(true);
}
