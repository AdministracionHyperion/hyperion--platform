import type {
  AgentRepositoryPort,
  AgentVersionRepositoryPort,
} from "../../../modules/agent-platform/agent-builder/src";
import type {
  EvalRepositoryPort,
  EvalRunRepositoryPort,
} from "../../../modules/agent-platform/evals/src";
import type {
  FlowRepositoryPort,
  FlowVersionRepositoryPort,
} from "../../../modules/agent-platform/flow-management/src";
import type {
  KnowledgeRepositoryPort,
  KnowledgeVersionRepositoryPort,
} from "../../../modules/agent-platform/knowledge-rag/src";
import type {
  PromptRepositoryPort,
  PromptVersionRepositoryPort,
} from "../../../modules/agent-platform/prompt-management/src";
import type { AuditLogPort } from "../../../modules/core/audit/src";
import type { FeatureFlagRepositoryPort } from "../../../modules/core/feature-flags/src";
import type { FeedbackRepositoryPort } from "../../../modules/core/feedback/src";
import type { TenantRepositoryPort } from "../../../modules/core/tenancy/src";
import type { VersionRepositoryPort } from "../../../modules/core/versioning/src";
import type {
  CedcoAgreementRepositoryPort,
  CedcoD02ConfigurationRepositoryPort,
  CedcoD02MetricsPort,
  CedcoServiceRepositoryPort,
  CedcoSiteRepositoryPort,
} from "../../../modules/products/cedco/d02-calls/src";
import type {
  CallEventRepositoryPort,
  CallSessionRepositoryPort,
} from "../../../modules/voice/voice-core/src";
import type { HandoffRepositoryPort } from "../../../modules/voice/handoff/src";
import type { HyperionPrismaClient } from "./prisma/prisma-types";
import {
  PrismaAgentRepository,
  PrismaAgentVersionRepository,
  PrismaEvalRepository,
  PrismaEvalRunRepository,
  PrismaFlowRepository,
  PrismaFlowVersionRepository,
  PrismaKnowledgeRepository,
  PrismaKnowledgeVersionRepository,
  PrismaPromptRepository,
  PrismaPromptVersionRepository,
} from "./repositories/agent-platform";
import {
  PrismaAuditLogRepository,
  PrismaFeatureFlagRepository,
  PrismaFeedbackRepository,
  PrismaTenantRepository,
  PrismaVersionRepository,
} from "./repositories/core";
import {
  PrismaCedcoAgreementRepository,
  PrismaCedcoD02ConfigurationRepository,
  PrismaCedcoD02MetricsRepository,
  PrismaCedcoServiceRepository,
  PrismaCedcoSiteRepository,
} from "./repositories/products/cedco/d02-calls";
import {
  PrismaCallEventRepository,
  PrismaCallSessionRepository,
  PrismaHandoffRepository,
} from "./repositories/voice";

export function createRepositoryPortAssertions(prisma: HyperionPrismaClient) {
  const tenantRepository: TenantRepositoryPort = new PrismaTenantRepository(prisma);
  const auditRepository: AuditLogPort = new PrismaAuditLogRepository(prisma);
  const featureFlagRepository: FeatureFlagRepositoryPort = new PrismaFeatureFlagRepository(prisma);
  const versionRepository: VersionRepositoryPort = new PrismaVersionRepository(prisma);
  const feedbackRepository: FeedbackRepositoryPort = new PrismaFeedbackRepository(prisma);
  const agentRepository: AgentRepositoryPort = new PrismaAgentRepository(prisma);
  const agentVersionRepository: AgentVersionRepositoryPort = new PrismaAgentVersionRepository(
    prisma,
  );
  const promptRepository: PromptRepositoryPort = new PrismaPromptRepository(prisma);
  const promptVersionRepository: PromptVersionRepositoryPort = new PrismaPromptVersionRepository(
    prisma,
  );
  const flowRepository: FlowRepositoryPort = new PrismaFlowRepository(prisma);
  const flowVersionRepository: FlowVersionRepositoryPort = new PrismaFlowVersionRepository(prisma);
  const knowledgeRepository: KnowledgeRepositoryPort = new PrismaKnowledgeRepository(prisma);
  const knowledgeVersionRepository: KnowledgeVersionRepositoryPort =
    new PrismaKnowledgeVersionRepository(prisma);
  const evalRepository: EvalRepositoryPort = new PrismaEvalRepository(prisma);
  const evalRunRepository: EvalRunRepositoryPort = new PrismaEvalRunRepository(prisma);
  const callSessionRepository: CallSessionRepositoryPort = new PrismaCallSessionRepository(prisma);
  const callEventRepository: CallEventRepositoryPort = new PrismaCallEventRepository(prisma);
  const handoffRepository: HandoffRepositoryPort = new PrismaHandoffRepository(prisma);
  const cedcoSiteRepository: CedcoSiteRepositoryPort = new PrismaCedcoSiteRepository(prisma);
  const cedcoServiceRepository: CedcoServiceRepositoryPort = new PrismaCedcoServiceRepository(
    prisma,
  );
  const cedcoAgreementRepository: CedcoAgreementRepositoryPort = new PrismaCedcoAgreementRepository(
    prisma,
  );
  const cedcoConfigurationRepository: CedcoD02ConfigurationRepositoryPort =
    new PrismaCedcoD02ConfigurationRepository(prisma);
  const cedcoMetricsRepository: CedcoD02MetricsPort = new PrismaCedcoD02MetricsRepository(prisma);

  return [
    tenantRepository,
    auditRepository,
    featureFlagRepository,
    versionRepository,
    feedbackRepository,
    agentRepository,
    agentVersionRepository,
    promptRepository,
    promptVersionRepository,
    flowRepository,
    flowVersionRepository,
    knowledgeRepository,
    knowledgeVersionRepository,
    evalRepository,
    evalRunRepository,
    callSessionRepository,
    callEventRepository,
    handoffRepository,
    cedcoSiteRepository,
    cedcoServiceRepository,
    cedcoAgreementRepository,
    cedcoConfigurationRepository,
    cedcoMetricsRepository,
  ] as const;
}
