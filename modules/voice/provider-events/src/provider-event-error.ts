import { domainError, type DomainError } from "../../../../packages/shared/src/core";

export function providerEventError(message: string): DomainError {
  return domainError("invalid_state", message);
}

export function providerEventValidationError(message: string): DomainError {
  return domainError("invalid_metadata", message);
}

export function providerEventConflictError(message: string): DomainError {
  return domainError("conflict", message);
}
