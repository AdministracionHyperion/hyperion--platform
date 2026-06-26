import {
  fail,
  ok,
  sanitizeMetadata,
  type DomainError,
  type OperationContext,
  type Result,
} from "../../../../../packages/shared/src/core";
import type { AuditLogPort } from "../../../../core/audit/src/audit-log.port";
import { recordAuditEvent } from "../../../../core/audit/src/use-cases/record-audit-event";
import type { ActorContext } from "../../../../core/identity-access/src/actor-context";
import { rolesAllow } from "../../../../core/identity-access/src/rbac-policy";
import type { CallId } from "../../../voice-core/src/call-id";
import { validateVoiceMetadataKeys } from "../../../voice-core/src/call-data-policy";
import { createHandoffId } from "../handoff-id";
import type { HandoffPriority } from "../handoff-priority";
import type { HandoffRepositoryPort } from "../handoff-repository.port";
import type { HandoffRequest } from "../handoff-request";
import { validateHandoffSummary } from "../handoff-policy";

export interface CreateHandoffRequestInput {
  readonly context: OperationContext;
  readonly actor: ActorContext;
  readonly repository: HandoffRepositoryPort;
  readonly callId: CallId;
  readonly priority: HandoffPriority;
  readonly reason: string;
  readonly targetQueue: string;
  readonly redactedSummary: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
  readonly auditLog?: AuditLogPort;
}

export async function createHandoffRequest(
  input: CreateHandoffRequestInput,
): Promise<Result<HandoffRequest, DomainError>> {
  if (
    !rolesAllow(input.actor.roles, "voice:handoff:manage") &&
    !rolesAllow(input.actor.roles, "voice:call:write")
  ) {
    return fail({ code: "forbidden", message: "actor cannot create handoff request" });
  }

  const summaryValidation = validateHandoffSummary(input.redactedSummary);
  if (!summaryValidation.ok) {
    return fail(summaryValidation.error);
  }

  const metadataValidation = validateVoiceMetadataKeys(input.metadata);
  if (!metadataValidation.ok) {
    return fail(metadataValidation.error);
  }

  const request: HandoffRequest = {
    handoffId: createHandoffId(),
    tenantId: input.context.tenantId,
    callId: input.callId,
    status: "requested",
    priority: input.priority,
    reason: input.reason,
    targetQueue: input.targetQueue,
    redactedSummary: input.redactedSummary,
    createdAt: input.context.occurredAt,
    metadata: sanitizeMetadata(input.metadata),
  };

  await input.repository.save(request);

  if (input.auditLog) {
    await recordAuditEvent(input.auditLog, {
      context: input.context,
      action: "voice.handoff.requested",
      resourceType: "handoff_request",
      resourceId: request.handoffId,
      result: "success",
      metadata: { callId: request.callId, priority: request.priority },
    });
  }

  return ok(request);
}
