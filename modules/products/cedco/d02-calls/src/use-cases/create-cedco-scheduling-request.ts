import {
  createCorrelationId,
  fail,
  ok,
  sanitizeMetadata,
  type DomainError,
  type OperationContext,
  type Result,
} from "../../../../../../packages/shared/src/core";
import type { AuditLogPort } from "../../../../../core/audit/src/audit-log.port";
import { recordAuditEvent } from "../../../../../core/audit/src/use-cases/record-audit-event";
import type { CallId } from "../../../../../voice/voice-core/src";
import type { CedcoD02Configuration } from "../cedco-d02-configuration";
import { evaluateCedcoSchedulingPolicy } from "../cedco-scheduling-policy";
import type { CedcoSchedulingPort } from "../cedco-scheduling.port";
import type { CedcoSchedulingRequest } from "../cedco-scheduling-request";
import { createCedcoPatientContextRef } from "../cedco-patient-context-ref";
import { createCedcoServiceId } from "../cedco-service-id";
import { createCedcoSiteId } from "../cedco-site-id";

export interface CreateCedcoSchedulingRequestInput {
  readonly context: OperationContext;
  readonly configuration: CedcoD02Configuration;
  readonly patientContextRef: string;
  readonly serviceId: string;
  readonly siteId?: string;
  readonly callId?: CallId;
  readonly schedulingPort?: CedcoSchedulingPort;
  readonly metadata?: Readonly<Record<string, unknown>>;
  readonly auditLog?: AuditLogPort;
}

export async function createCedcoSchedulingRequest(
  input: CreateCedcoSchedulingRequestInput,
): Promise<Result<CedcoSchedulingRequest, DomainError>> {
  const patientContextRef = createCedcoPatientContextRef(input.patientContextRef);
  if (!patientContextRef.ok) {
    return fail(patientContextRef.error);
  }
  const serviceId = createCedcoServiceId(input.serviceId);
  if (!serviceId.ok) {
    return fail(serviceId.error);
  }
  const siteId = input.siteId ? createCedcoSiteId(input.siteId) : undefined;
  if (siteId && !siteId.ok) {
    return fail(siteId.error);
  }

  const policy = evaluateCedcoSchedulingPolicy({
    configuration: input.configuration,
    schedulingPort: input.schedulingPort,
  });
  if (!policy.ok) {
    return fail(policy.error);
  }

  const request: CedcoSchedulingRequest = {
    schedulingRequestId: createLocalId("cedco-scheduling"),
    tenantId: input.context.tenantId,
    callId: input.callId,
    patientContextRef: patientContextRef.value,
    serviceId: serviceId.value,
    siteId: siteId?.value,
    status: policy.value,
    mode: policy.value === "integration_required" ? "integration_required" : "mock",
    metadata: sanitizeMetadata(input.metadata),
  };

  if (input.auditLog) {
    await recordAuditEvent(input.auditLog, {
      context: input.context,
      action: "cedco.scheduling.requested",
      resourceType: "cedco_scheduling_request",
      resourceId: request.schedulingRequestId,
      result: "success",
      metadata: { status: request.status, mode: request.mode },
    });
  }

  return ok(request);
}

function createLocalId(prefix: string): string {
  const correlationId = createCorrelationId();
  return correlationId.ok ? `${prefix}-${correlationId.value}` : `${prefix}-${Date.now()}`;
}
