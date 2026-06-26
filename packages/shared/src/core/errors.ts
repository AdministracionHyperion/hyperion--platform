export type DomainErrorCode =
  | "invalid_id"
  | "invalid_metadata"
  | "invalid_operation_context"
  | "not_found"
  | "forbidden"
  | "tenant_isolation_violation"
  | "invalid_state"
  | "conflict";

export interface DomainError {
  readonly code: DomainErrorCode;
  readonly message: string;
  readonly details?: Readonly<Record<string, string>>;
}

export function domainError(
  code: DomainErrorCode,
  message: string,
  details?: Readonly<Record<string, string>>,
): DomainError {
  return details ? { code, message, details } : { code, message };
}
