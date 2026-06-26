import { domainError, type DomainError } from "./errors";
import { createCorrelationId, type CorrelationId } from "./ids";
import { fail, ok, type Result } from "./result";
import { nowUtc } from "./time";

export interface OperationContext {
  readonly tenantId: string;
  readonly actorId: string;
  readonly correlationId: CorrelationId;
  readonly occurredAt: Date;
  readonly source: string;
}

export interface OperationContextInput {
  readonly tenantId: string;
  readonly actorId: string;
  readonly correlationId: string;
  readonly occurredAt?: Date;
  readonly source: string;
}

export function createOperationContext(
  input: OperationContextInput,
): Result<OperationContext, DomainError> {
  if (input.tenantId.trim().length === 0) {
    return fail(domainError("invalid_operation_context", "tenantId is required"));
  }

  if (input.actorId.trim().length === 0) {
    return fail(domainError("invalid_operation_context", "actorId is required"));
  }

  if (input.source.trim().length === 0) {
    return fail(domainError("invalid_operation_context", "source is required"));
  }

  const correlationId = createCorrelationId(input.correlationId);
  if (!correlationId.ok) {
    return fail(domainError("invalid_operation_context", "correlationId is required"));
  }

  return ok({
    tenantId: input.tenantId,
    actorId: input.actorId,
    correlationId: correlationId.value,
    occurredAt: input.occurredAt ?? nowUtc(),
    source: input.source,
  });
}
