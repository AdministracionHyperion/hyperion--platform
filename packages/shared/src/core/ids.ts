import { domainError, type DomainError } from "./errors";
import { fail, ok, type Result } from "./result";

export type Brand<T, TBrand extends string> = T & { readonly __brand: TBrand };

export type CorrelationId = Brand<string, "CorrelationId">;

const safeIdentifierPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;

export function validateSafeIdentifier(value: string, label: string): Result<string, DomainError> {
  if (value.trim().length === 0) {
    return fail(domainError("invalid_id", `${label} must not be empty`));
  }

  if (value !== value.trim()) {
    return fail(domainError("invalid_id", `${label} must not contain surrounding whitespace`));
  }

  if (!safeIdentifierPattern.test(value)) {
    return fail(
      domainError("invalid_id", `${label} must use lowercase letters, numbers, and hyphens only`),
    );
  }

  return ok(value);
}

export function createCorrelationId(
  value: string = generateLocalCorrelationId(),
): Result<CorrelationId, DomainError> {
  if (value.trim().length === 0) {
    return fail(domainError("invalid_id", "correlationId must not be empty"));
  }

  return ok(value as CorrelationId);
}

function generateLocalCorrelationId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 10);
  return `corr-${timestamp}-${random}`;
}
