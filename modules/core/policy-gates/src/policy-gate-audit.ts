export interface PolicyGateAuditRecord {
  readonly tenantId: string;
  readonly actorId: string;
  readonly correlationId: string;
  readonly action: string;
  readonly resourceType: string;
  readonly resourceId: string;
  readonly result: "success" | "failure";
  readonly metadata?: Readonly<Record<string, unknown>>;
  readonly occurredAt: Date;
}

export interface ApiAuditLikePort {
  readonly recordPolicyGateAudit?: (event: PolicyGateAuditRecord) => Promise<void>;
}
