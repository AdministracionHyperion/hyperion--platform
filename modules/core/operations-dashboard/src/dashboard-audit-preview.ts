export interface DashboardAuditPreview {
  readonly auditId: string;
  readonly action: string;
  readonly severity: "info" | "warn" | "critical";
  readonly occurredAt: string;
  readonly correlationId: string;
  readonly metadata: Readonly<Record<string, unknown>>;
}
