import { domainError, type DomainError } from "../../../../packages/shared/src/core";
import type { Permission } from "./permission";

export interface AuthorizationError extends DomainError {
  readonly code: "forbidden";
  readonly permission: Permission;
}

export function authorizationError(permission: Permission): AuthorizationError {
  return {
    ...domainError("forbidden", `Actor is not authorized for ${permission}`),
    code: "forbidden",
    permission,
  };
}
