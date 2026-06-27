import {
  createCorrelationId,
  domainError,
  fail,
  ok,
  sanitizeMetadata,
  type DomainError,
  type OperationContext,
  type Result,
} from "../../../../../packages/shared/src/core";
import type { CallId } from "../call-id";
import type { CallSessionRepositoryPort } from "../call-session-repository.port";
import { validateVoiceMetadataKeys } from "../call-data-policy";
import type { ConversationTurn, ConversationTurnId } from "../conversation-turn";
import type { ConversationTurnRole } from "../conversation-turn-role";

export interface RecordConversationTurnInput {
  readonly context: OperationContext;
  readonly repository: CallSessionRepositoryPort;
  readonly callId: CallId;
  readonly role: ConversationTurnRole;
  readonly contentRedacted: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export async function recordConversationTurn(
  input: RecordConversationTurnInput,
): Promise<Result<ConversationTurn, DomainError>> {
  const metadataValidation = validateVoiceMetadataKeys(input.metadata);
  if (!metadataValidation.ok) {
    return fail(metadataValidation.error);
  }

  if (input.contentRedacted.trim().length === 0) {
    return fail(domainError("invalid_state", "contentRedacted is required"));
  }

  const session = await input.repository.findById(input.context.tenantId, input.callId);
  if (!session) {
    return fail(domainError("not_found", "call session not found"));
  }

  const turn: ConversationTurn = {
    turnId: createConversationTurnId(),
    callId: input.callId,
    tenantId: input.context.tenantId,
    role: input.role,
    contentRedacted: input.contentRedacted,
    occurredAt: input.context.occurredAt,
    metadata: sanitizeMetadata(input.metadata),
  };

  await input.repository.appendTurn(turn);
  await input.repository.save({
    ...session,
    turns: [...session.turns, turn],
    updatedAt: input.context.occurredAt,
  });
  return ok(turn);
}

function createConversationTurnId(): ConversationTurnId {
  const correlationId = createCorrelationId();
  return (
    correlationId.ok ? `turn-${correlationId.value}` : `turn-${Date.now()}`
  ) as ConversationTurnId;
}
