import {
  domainError,
  fail,
  ok,
  sanitizeMetadata,
  type DomainError,
  type Result,
} from "../../../../../../../packages/shared/src/core";
import { findForbiddenRuntimeKey } from "../../../../../../voice/call-runtime/src";
import type { CedcoCallObjective } from "../../cedco-call-objective";
import type { CedcoCallPurpose } from "../../cedco-call-purpose";

export interface CedcoD02MockCallIntentInput {
  readonly tenantId: string;
  readonly actorId: string;
  readonly correlationId: string;
  readonly cedcoSiteId: string;
  readonly serviceId: string;
  readonly agreementId?: string;
  readonly safeContactRef: string;
  readonly patientContextRef: string;
  readonly consentRef: string;
  readonly callPurpose: CedcoCallPurpose;
  readonly objective: CedcoCallObjective;
  readonly scriptId?: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface CedcoD02MockCallIntent {
  readonly callIntentId: string;
  readonly tenantId: string;
  readonly actorId: string;
  readonly correlationId: string;
  readonly cedcoSiteId: string;
  readonly serviceId: string;
  readonly agreementId?: string;
  readonly safeContactRef: string;
  readonly patientContextRef: string;
  readonly consentRef: string;
  readonly callPurpose: CedcoCallPurpose;
  readonly objective: CedcoCallObjective;
  readonly scriptId: string;
  readonly runtimeMode: "mock";
  readonly metadata: ReturnType<typeof sanitizeMetadata>;
}

export function buildCedcoD02MockCallIntent(
  input: CedcoD02MockCallIntentInput,
): Result<CedcoD02MockCallIntent, DomainError> {
  const forbidden = findForbiddenRuntimeKey(input.metadata);
  if (forbidden) {
    return fail({
      ...domainError(
        "invalid_metadata",
        `CEDCO D02 mock intent contains forbidden field ${forbidden}`,
      ),
    });
  }

  return ok({
    callIntentId: `cedco-d02-intent-${input.correlationId}`,
    tenantId: input.tenantId,
    actorId: input.actorId,
    correlationId: input.correlationId,
    cedcoSiteId: input.cedcoSiteId,
    serviceId: input.serviceId,
    ...(input.agreementId ? { agreementId: input.agreementId } : {}),
    safeContactRef: input.safeContactRef,
    patientContextRef: input.patientContextRef,
    consentRef: input.consentRef,
    callPurpose: input.callPurpose,
    objective: input.objective,
    scriptId: input.scriptId ?? "cedco-d02-default-mock",
    runtimeMode: "mock",
    metadata: sanitizeMetadata(input.metadata),
  });
}
