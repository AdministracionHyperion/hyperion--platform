import {
  domainError,
  fail,
  ok,
  sanitizeMetadata,
  type DomainError,
  type OperationContext,
  type Result,
} from "../../../../../../packages/shared/src/core";
import type { AuditLogPort } from "../../../../../core/audit/src/audit-log.port";
import { recordAuditEvent } from "../../../../../core/audit/src/use-cases/record-audit-event";
import type { ActorContext } from "../../../../../core/identity-access/src/actor-context";
import { rolesAllow } from "../../../../../core/identity-access/src/rbac-policy";
import type { CedcoAgreement } from "../cedco-agreement";
import { createCedcoAgreementId } from "../cedco-agreement-id";
import type { CedcoAgreementRepositoryPort } from "../cedco-agreement-repository.port";
import type { CedcoAgreementStatus } from "../cedco-agreement-status";
import { createCedcoServiceId, type CedcoServiceId } from "../cedco-service-id";

export interface RegisterCedcoAgreementInput {
  readonly context: OperationContext;
  readonly actor: ActorContext;
  readonly repository: CedcoAgreementRepositoryPort;
  readonly agreementId: string;
  readonly name: string;
  readonly status?: CedcoAgreementStatus;
  readonly applicableServiceIds: readonly string[];
  readonly allowedServiceIds: readonly CedcoServiceId[];
  readonly notesRedacted?: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
  readonly auditLog?: AuditLogPort;
}

export async function registerCedcoAgreement(
  input: RegisterCedcoAgreementInput,
): Promise<Result<CedcoAgreement, DomainError>> {
  if (!rolesAllow(input.actor.roles, "tenant:update")) {
    return fail({ code: "forbidden", message: "actor cannot register CEDCO agreement" });
  }

  const agreementId = createCedcoAgreementId(input.agreementId);
  if (!agreementId.ok) {
    return fail(agreementId.error);
  }

  const applicableServiceIds = [];
  for (const rawServiceId of input.applicableServiceIds) {
    const serviceId = createCedcoServiceId(rawServiceId);
    if (!serviceId.ok) {
      return fail(serviceId.error);
    }
    if (!input.allowedServiceIds.includes(serviceId.value)) {
      return fail(
        domainError("invalid_state", "agreement references a service outside the allowlist"),
      );
    }
    applicableServiceIds.push(serviceId.value);
  }

  const agreement: CedcoAgreement = {
    agreementId: agreementId.value,
    tenantId: input.context.tenantId,
    name: input.name,
    status: input.status ?? "active",
    applicableServiceIds,
    notesRedacted: input.notesRedacted,
    metadata: sanitizeMetadata(input.metadata),
  };

  await input.repository.save(agreement);

  if (input.auditLog) {
    await recordAuditEvent(input.auditLog, {
      context: input.context,
      action: "cedco.agreement.registered",
      resourceType: "cedco_agreement",
      resourceId: agreement.agreementId,
      result: "success",
      metadata: { agreementId: agreement.agreementId },
    });
  }

  return ok(agreement);
}
