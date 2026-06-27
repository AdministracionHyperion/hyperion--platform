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
import type { CedcoD02Configuration } from "../cedco-d02-configuration";
import { createCedcoAgreementId } from "../cedco-agreement-id";
import type { CedcoEligibilityCheck } from "../cedco-eligibility-check";
import { evaluateCedcoEligibilityPolicy } from "../cedco-eligibility-policy";
import { createCedcoPatientContextRef } from "../cedco-patient-context-ref";
import { createCedcoServiceId } from "../cedco-service-id";

export interface CreateCedcoEligibilityCheckInput {
  readonly context: OperationContext;
  readonly configuration: CedcoD02Configuration;
  readonly patientContextRef: string;
  readonly agreementId?: string;
  readonly serviceId?: string;
  readonly agreementKnown?: boolean;
  readonly metadata?: Readonly<Record<string, unknown>>;
  readonly auditLog?: AuditLogPort;
}

export async function createCedcoEligibilityCheck(
  input: CreateCedcoEligibilityCheckInput,
): Promise<Result<CedcoEligibilityCheck, DomainError>> {
  const patientContextRef = createCedcoPatientContextRef(input.patientContextRef);
  if (!patientContextRef.ok) {
    return fail(patientContextRef.error);
  }

  const agreementId = input.agreementId ? createCedcoAgreementId(input.agreementId) : undefined;
  if (agreementId && !agreementId.ok) {
    return fail(agreementId.error);
  }

  const serviceId = input.serviceId ? createCedcoServiceId(input.serviceId) : undefined;
  if (serviceId && !serviceId.ok) {
    return fail(serviceId.error);
  }

  const policy = evaluateCedcoEligibilityPolicy(input.configuration);

  const policyValue = policy.ok ? policy.value : "unknown";
  const status =
    input.agreementKnown === false
      ? "unknown"
      : policyValue === "eligible"
        ? "eligible"
        : policyValue === "integration_required"
          ? "integration_required"
          : "unknown";

  const check: CedcoEligibilityCheck = {
    eligibilityCheckId: createLocalId("cedco-eligibility"),
    tenantId: input.context.tenantId,
    patientContextRef: patientContextRef.value,
    agreementId: agreementId?.value,
    serviceId: serviceId?.value,
    status,
    mode: status === "integration_required" ? "integration_required" : "mock",
    metadata: sanitizeMetadata(input.metadata),
  };

  if (input.auditLog) {
    await recordAuditEvent(input.auditLog, {
      context: input.context,
      action: "cedco.eligibility.checked",
      resourceType: "cedco_eligibility_check",
      resourceId: check.eligibilityCheckId,
      result: "success",
      metadata: { status: check.status, mode: check.mode },
    });
  }

  return ok(check);
}

function createLocalId(prefix: string): string {
  const correlationId = createCorrelationId();
  return correlationId.ok ? `${prefix}-${correlationId.value}` : `${prefix}-${Date.now()}`;
}
