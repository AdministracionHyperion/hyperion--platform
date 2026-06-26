import {
  fail,
  isSensitiveMetadataKey,
  ok,
  sanitizeMetadata,
  type DomainError,
  type OperationContext,
  type Result,
} from "../../../../../../packages/shared/src/core";
import type { CedcoAgreementId } from "../cedco-agreement-id";
import type { CedcoAgreementRepositoryPort } from "../cedco-agreement-repository.port";
import type { CedcoCallIntent } from "../cedco-call-intent";
import type { CedcoCallObjective } from "../cedco-call-objective";
import type {
  CedcoD02CallReadiness,
  CedcoD02ReadinessBlockingReason,
} from "../cedco-d02-call-readiness";
import type { CedcoD02Configuration } from "../cedco-d02-configuration";
import { createCedcoAgreementId } from "../cedco-agreement-id";
import { createCedcoServiceId } from "../cedco-service-id";
import type { CedcoServiceRepositoryPort } from "../cedco-service-repository.port";
import { createCedcoSiteId } from "../cedco-site-id";
import type { CedcoSiteRepositoryPort } from "../cedco-site-repository.port";

export interface EvaluateCedcoCallReadinessInput {
  readonly context: OperationContext;
  readonly configuration: CedcoD02Configuration;
  readonly objective: CedcoCallObjective;
  readonly intent?: CedcoCallIntent;
  readonly siteId?: string;
  readonly serviceId?: string;
  readonly agreementId?: string;
  readonly siteRepository?: CedcoSiteRepositoryPort;
  readonly serviceRepository?: CedcoServiceRepositoryPort;
  readonly agreementRepository?: CedcoAgreementRepositoryPort;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export async function evaluateCedcoCallReadiness(
  input: EvaluateCedcoCallReadinessInput,
): Promise<Result<CedcoD02CallReadiness, DomainError>> {
  if (input.context.tenantId !== input.configuration.tenantId) {
    return fail({ code: "tenant_isolation_violation", message: "configuration tenant mismatch" });
  }

  const blockingReasons: CedcoD02ReadinessBlockingReason[] = ["real_calls_disabled"];
  const warnings: string[] = [];

  if (!input.configuration.activeAgentVersionId) {
    blockingReasons.push("missing_agent_version");
  }

  if (
    requiresKnowledge(input.objective, input.intent) &&
    !input.configuration.activeKnowledgeBaseVersionId
  ) {
    blockingReasons.push("missing_knowledge_base_version");
  }

  for (const key of Object.keys(input.metadata ?? {})) {
    if (isSensitiveMetadataKey(key) || key === "from_number") {
      blockingReasons.push("pii_policy_violation");
      break;
    }
  }

  if (input.siteId) {
    const siteId = createCedcoSiteId(input.siteId);
    if (!siteId.ok) {
      return fail(siteId.error);
    }
    const known = input.siteRepository
      ? await input.siteRepository.findById(input.context.tenantId, siteId.value)
      : input.configuration.allowedSiteIds.includes(siteId.value);
    if (!known) {
      blockingReasons.push("unknown_site");
    }
  }

  if (input.serviceId) {
    const serviceId = createCedcoServiceId(input.serviceId);
    if (!serviceId.ok) {
      return fail(serviceId.error);
    }
    const known = input.serviceRepository
      ? await input.serviceRepository.findById(input.context.tenantId, serviceId.value)
      : input.configuration.allowedServiceIds.includes(serviceId.value);
    if (!known) {
      blockingReasons.push("unknown_service");
    }
  }

  if (input.agreementId) {
    const agreementId = createCedcoAgreementId(input.agreementId);
    if (!agreementId.ok) {
      return fail(agreementId.error);
    }
    const known = await isKnownAgreement(
      input.context.tenantId,
      agreementId.value,
      input.agreementRepository,
    );
    if (!known) {
      blockingReasons.push("unknown_agreement");
    }
  }

  if (input.configuration.schedulingMode === "integration") {
    warnings.push("scheduling_integration_required_future_loop");
  }

  if (input.configuration.eligibilityMode === "integration") {
    warnings.push("eligibility_integration_required_future_loop");
  }

  const uniqueBlockingReasons = [...new Set(blockingReasons)];

  return ok({
    tenantId: input.context.tenantId,
    objective: input.objective,
    intent: input.intent,
    ready: uniqueBlockingReasons.length === 0,
    blockingReasons: uniqueBlockingReasons,
    warnings,
    nextStep:
      uniqueBlockingReasons.length > 0
        ? "resolve_domain_readiness_blockers_before_runtime"
        : "continue_with_mock_or_integration_layer_checks",
    checkedAt: input.context.occurredAt,
    metadata: sanitizeMetadata(input.metadata),
  });
}

function requiresKnowledge(objective: CedcoCallObjective, intent?: CedcoCallIntent): boolean {
  return (
    objective === "faq" ||
    objective === "orientation" ||
    intent === "consultar_sede" ||
    intent === "consultar_servicio" ||
    intent === "consultar_convenio" ||
    intent === "consultar_horario"
  );
}

async function isKnownAgreement(
  tenantId: string,
  agreementId: CedcoAgreementId,
  repository?: CedcoAgreementRepositoryPort,
): Promise<boolean> {
  if (!repository) {
    return false;
  }

  const agreement = await repository.findById(tenantId, agreementId);
  return agreement?.status === "active";
}
