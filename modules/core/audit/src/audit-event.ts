import type { SafeMetadata } from "../../../../packages/shared/src/core";
import type { AuditAction } from "./audit-action";
import type { AuditResourceType } from "./audit-resource";

export type AuditResult = "success" | "failure";

export interface AuditEvent {
  readonly auditEventId: string;
  readonly tenantId: string;
  readonly actorId: string;
  readonly correlationId: string;
  readonly action: AuditAction;
  readonly resourceType: AuditResourceType;
  readonly resourceId: string;
  readonly result: AuditResult;
  readonly metadata: SafeMetadata;
  readonly occurredAt: Date;
}
