import {
  validateSafeIdentifier,
  type Brand,
  type DomainError,
  type Result,
} from "../../../../packages/shared/src/core";

export type TenantId = Brand<string, "TenantId">;

export function createTenantId(value: string): Result<TenantId, DomainError> {
  const validated = validateSafeIdentifier(value, "tenantId");
  return validated.ok ? { ok: true, value: validated.value as TenantId } : validated;
}
