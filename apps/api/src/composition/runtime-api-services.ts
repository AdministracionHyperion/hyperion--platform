import { createPrismaClient, type HyperionPrismaClient } from "../../../../packages/db/src";
import type { ApiConfig } from "../config/api-config";
import {
  createFakeApiServices,
  createPrismaBackedApiServices,
  type ApiServices,
} from "../services";
import { StagingInternalDialerHttpClient } from "../services/staging-internal-dialer-http-client";

export interface RuntimeApiServices {
  readonly mode: ApiConfig["servicesMode"];
  readonly services: ApiServices;
  readonly prisma?: HyperionPrismaClient;
  close(): Promise<void>;
}

export function createApiServicesFromConfig(config: ApiConfig): RuntimeApiServices {
  if (config.servicesMode === "prisma") {
    return createRuntimePrismaServices(config);
  }

  return createRuntimeFakeServices(config);
}

export function createRuntimePrismaServices(config: ApiConfig): RuntimeApiServices {
  if (!config.databaseUrl) {
    throw new Error("DATABASE_URL is required when API_SERVICES_MODE=prisma.");
  }

  const prisma = createPrismaClient({ databaseUrl: config.databaseUrl });
  return {
    mode: "prisma",
    prisma,
    services: createPrismaBackedApiServices({
      prisma,
      dialerDryRun: createConfiguredDialerDryRun(config),
    }),
    close: async () => {
      await prisma.$disconnect();
    },
  };
}

export function createRuntimeFakeServices(config: ApiConfig): RuntimeApiServices {
  if (config.nodeEnv === "production") {
    throw new Error("Fake API services are not allowed in production.");
  }

  return {
    mode: "fake",
    services: createFakeApiServices({ dialerDryRun: createConfiguredDialerDryRun(config) }),
    close: async () => undefined,
  };
}

function createConfiguredDialerDryRun(config: ApiConfig) {
  return config.internalDialerBaseUrl
    ? new StagingInternalDialerHttpClient({ baseUrl: config.internalDialerBaseUrl })
    : undefined;
}
