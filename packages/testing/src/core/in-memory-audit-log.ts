import type { AuditEvent } from "../../../../modules/core/audit/src/audit-event";
import type { AuditLogPort } from "../../../../modules/core/audit/src/audit-log.port";

export class InMemoryAuditLog implements AuditLogPort {
  private readonly events: AuditEvent[] = [];

  async append(event: AuditEvent): Promise<void> {
    this.events.push(event);
  }

  async findByTenant(tenantId: string): Promise<readonly AuditEvent[]> {
    return this.events.filter((event) => event.tenantId === tenantId);
  }
}
