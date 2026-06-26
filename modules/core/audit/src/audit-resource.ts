export type AuditResourceType =
  | "tenant"
  | "actor"
  | "feature_flag"
  | "versioned_resource"
  | "feedback"
  | string;

export interface AuditResource {
  readonly resourceType: AuditResourceType;
  readonly resourceId: string;
}
