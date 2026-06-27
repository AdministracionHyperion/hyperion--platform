export type AuditAction =
  | "tenant.created"
  | "tenant.context.resolved"
  | "authorization.checked"
  | "feature_flag.evaluated"
  | "version.created"
  | "version.activated"
  | "version.archived"
  | "feedback.recorded"
  | string;
