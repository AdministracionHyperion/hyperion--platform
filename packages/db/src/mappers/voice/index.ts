import type {
  CallEvent,
  CallParticipant,
  CallSession,
  ConversationTurn,
} from "../../../../../modules/voice/voice-core/src";
import type { HandoffRequest } from "../../../../../modules/voice/handoff/src";
import { sanitizeMetadata } from "../../../../shared/src/core";
import { toPrismaJson, toSafeMetadata } from "../../prisma/prisma-types";

export const callSessionToPrisma = (session: CallSession) => ({
  id: session.callId,
  tenantId: session.tenantId,
  direction: session.direction,
  status: session.status,
  agentRuntimeRef: session.agentRuntimeRef
    ? toPrismaJson({ ref: session.agentRuntimeRef })
    : undefined,
  knowledgeRuntimeRef: session.knowledgeRuntimeRef
    ? toPrismaJson({ ref: session.knowledgeRuntimeRef })
    : undefined,
  correlationId: session.correlationId,
  metadata: toPrismaJson(sanitizeMetadata(session.metadata)),
  startedAt: session.startedAt,
  endedAt: session.endedAt,
  createdAt: session.createdAt,
  updatedAt: session.updatedAt,
});

export function callSessionFromPrisma(row: ReturnType<typeof callSessionToPrisma>): CallSession {
  return {
    callId: row.id as CallSession["callId"],
    tenantId: row.tenantId,
    direction: row.direction as CallSession["direction"],
    status: row.status as CallSession["status"],
    agentRuntimeRef: extractRef(row.agentRuntimeRef),
    knowledgeRuntimeRef: extractRef(row.knowledgeRuntimeRef),
    correlationId: row.correlationId,
    metadata: toSafeMetadata(row.metadata),
    startedAt: row.startedAt,
    endedAt: row.endedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    participants: [],
    turns: [],
  };
}

export const callParticipantToPrisma = (
  participant: CallParticipant,
  tenantId: string,
  callId: string,
) => ({
  id: participant.participantId,
  tenantId,
  callId,
  role: participant.role,
  displayAlias: participant.displayAlias,
  metadata: toPrismaJson(sanitizeMetadata(participant.metadata)),
  createdAt: new Date(0),
});

export const callParticipantFromPrisma = (
  row: ReturnType<typeof callParticipantToPrisma>,
): CallParticipant => ({
  participantId: row.id,
  role: row.role as CallParticipant["role"],
  displayAlias: row.displayAlias,
  metadata: toSafeMetadata(row.metadata),
});

export const conversationTurnToPrisma = (turn: ConversationTurn) => ({
  id: turn.turnId,
  tenantId: turn.tenantId,
  callId: turn.callId,
  role: turn.role,
  contentRedacted: turn.contentRedacted,
  metadata: toPrismaJson(sanitizeMetadata(turn.metadata)),
  occurredAt: turn.occurredAt,
  createdAt: turn.occurredAt,
});

export const conversationTurnFromPrisma = (
  row: ReturnType<typeof conversationTurnToPrisma>,
): ConversationTurn => ({
  turnId: row.id as ConversationTurn["turnId"],
  tenantId: row.tenantId,
  callId: row.callId as ConversationTurn["callId"],
  role: row.role as ConversationTurn["role"],
  contentRedacted: row.contentRedacted,
  metadata: toSafeMetadata(row.metadata),
  occurredAt: row.occurredAt,
});

export const callEventToPrisma = (event: CallEvent) => ({
  id: event.callEventId,
  tenantId: event.tenantId,
  callId: event.callId,
  actorId: event.actorId,
  correlationId: event.correlationId,
  type: event.type,
  status: event.status,
  metadata: toPrismaJson(sanitizeMetadata(event.metadata)),
  occurredAt: event.occurredAt,
});

export const callEventFromPrisma = (row: ReturnType<typeof callEventToPrisma>): CallEvent => ({
  callEventId: row.id as CallEvent["callEventId"],
  tenantId: row.tenantId,
  callId: row.callId as CallEvent["callId"],
  actorId: row.actorId,
  correlationId: row.correlationId,
  type: row.type as CallEvent["type"],
  status: row.status as CallEvent["status"],
  metadata: toSafeMetadata(row.metadata),
  occurredAt: row.occurredAt,
});

export const handoffRequestToPrisma = (request: HandoffRequest) => ({
  id: request.handoffId,
  tenantId: request.tenantId,
  callId: request.callId,
  status: request.status,
  priority: request.priority,
  reason: request.reason,
  targetQueue: request.targetQueue,
  redactedSummary: request.redactedSummary,
  metadata: toPrismaJson(sanitizeMetadata(request.metadata)),
  createdAt: request.createdAt,
  assignedAt: request.assignedAt,
  resolvedAt: request.resolvedAt,
});

export const handoffRequestFromPrisma = (
  row: ReturnType<typeof handoffRequestToPrisma>,
): HandoffRequest => ({
  handoffId: row.id as HandoffRequest["handoffId"],
  tenantId: row.tenantId,
  callId: row.callId as HandoffRequest["callId"],
  status: row.status as HandoffRequest["status"],
  priority: row.priority as HandoffRequest["priority"],
  reason: row.reason,
  targetQueue: row.targetQueue,
  redactedSummary: row.redactedSummary,
  metadata: toSafeMetadata(row.metadata),
  createdAt: row.createdAt,
  assignedAt: row.assignedAt,
  resolvedAt: row.resolvedAt,
});

function extractRef(value: unknown): string | undefined {
  if (value && typeof value === "object" && "ref" in value) {
    return String((value as { readonly ref: unknown }).ref);
  }
  return undefined;
}
