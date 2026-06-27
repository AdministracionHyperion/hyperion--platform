import type { AuditEvent } from "./audit-event";

export interface AuditLogPort {
  append(event: AuditEvent): Promise<void>;
  findByTenant(tenantId: string): Promise<readonly AuditEvent[]>;
}
