import {
  PrismaAgentRepository,
  PrismaAgentVersionRepository,
  PrismaCallEventRepository,
  PrismaCallSessionRepository,
  PrismaCedcoAgreementRepository,
  PrismaCedcoD02ConfigurationRepository,
  PrismaCedcoD02MetricsRepository,
  PrismaCedcoServiceRepository,
  PrismaCedcoSiteRepository,
  PrismaFeatureFlagRepository,
  type HyperionPrismaClient,
} from "../../../../packages/db/src";

export interface PrismaApiComposition {
  readonly prisma: HyperionPrismaClient;
  readonly repositories: {
    readonly featureFlags: PrismaFeatureFlagRepository;
    readonly agents: PrismaAgentRepository;
    readonly agentVersions: PrismaAgentVersionRepository;
    readonly callSessions: PrismaCallSessionRepository;
    readonly callEvents: PrismaCallEventRepository;
    readonly cedcoSites: PrismaCedcoSiteRepository;
    readonly cedcoServices: PrismaCedcoServiceRepository;
    readonly cedcoAgreements: PrismaCedcoAgreementRepository;
    readonly cedcoConfiguration: PrismaCedcoD02ConfigurationRepository;
    readonly cedcoMetrics: PrismaCedcoD02MetricsRepository;
  };
}

export function createPrismaApiComposition(prisma: HyperionPrismaClient): PrismaApiComposition {
  return {
    prisma,
    repositories: {
      featureFlags: new PrismaFeatureFlagRepository(prisma),
      agents: new PrismaAgentRepository(prisma),
      agentVersions: new PrismaAgentVersionRepository(prisma),
      callSessions: new PrismaCallSessionRepository(prisma),
      callEvents: new PrismaCallEventRepository(prisma),
      cedcoSites: new PrismaCedcoSiteRepository(prisma),
      cedcoServices: new PrismaCedcoServiceRepository(prisma),
      cedcoAgreements: new PrismaCedcoAgreementRepository(prisma),
      cedcoConfiguration: new PrismaCedcoD02ConfigurationRepository(prisma),
      cedcoMetrics: new PrismaCedcoD02MetricsRepository(prisma),
    },
  };
}
