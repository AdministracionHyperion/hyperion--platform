import {
  createCorrelationId,
  type OperationContext,
} from "../../../../../packages/shared/src/core";
import { sanitizeAuditMetadata } from "../audit-metadata-sanitizer";
import type { AuditAction } from "../audit-action";
import type { AuditEvent, AuditResult } from "../audit-event";
import type { AuditLogPort } from "../audit-log.port";
import type { AuditResourceType } from "../audit-resource";

export interface RecordAuditEventInput {
  readonly context: OperationContext;
  readonly action: AuditAction;
  readonly resourceType: AuditResourceType;
  readonly resourceId: string;
  readonly result: AuditResult;
  readonly metadata?: Readonly<Record<string, unknown>>;
  readonly occurredAt?: Date;
}

export async function recordAuditEvent(
  auditLog: AuditLogPort,
  input: RecordAuditEventInput,
): Promise<AuditEvent> {
  const auditEvent: AuditEvent = {
    auditEventId: createAuditEventId(),
    tenantId: input.context.tenantId,
    actorId: input.context.actorId,
    correlationId: input.context.correlationId,
    action: input.action,
    resourceType: input.resourceType,
    resourceId: input.resourceId,
    result: input.result,
    metadata: sanitizeAuditMetadata(input.metadata),
    occurredAt: input.occurredAt ?? input.context.occurredAt,
  };

  await auditLog.append(auditEvent);
  return auditEvent;
}

function createAuditEventId(): string {
  const correlationId = createCorrelationId();
  return correlationId.ok ? `audit-${correlationId.value}` : `audit-${Date.now()}`;
}
