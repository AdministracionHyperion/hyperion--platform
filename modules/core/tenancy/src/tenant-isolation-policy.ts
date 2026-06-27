import {
  domainError,
  fail,
  ok,
  type DomainError,
  type OperationContext,
  type Result,
} from "../../../../packages/shared/src/core";

export function enforceTenantIsolation(
  context: OperationContext,
  resource: { readonly tenantId: string },
): Result<true, DomainError> {
  if (context.tenantId !== resource.tenantId) {
    return fail(
      domainError(
        "tenant_isolation_violation",
        "Resource tenantId does not match operation context tenantId",
      ),
    );
  }

  return ok(true);
}
