import type { FastifyInstance } from "fastify";
import type { PrismaClient } from "@prisma/client";
import { createPrismaTestHarness } from "../../../../packages/db/src/integration/prisma-test-harness";
import { InMemoryLogger, InMemoryMetricsRegistry } from "../../../../packages/observability/src";
import { createApiApp } from "../app";
import { createPrismaBackedApiServices } from "../services/prisma-backed-api-services";

export interface ApiPrismaTestHarness {
  readonly app: FastifyInstance;
  readonly prisma: PrismaClient;
  readonly logger: InMemoryLogger;
  readonly metrics: InMemoryMetricsRegistry;
  readonly migrate: () => Promise<void>;
  readonly cleanup: () => Promise<void>;
  readonly seedBaseContext: () => Promise<void>;
  readonly disconnect: () => Promise<void>;
}

export async function createApiPrismaTestHarness(
  databaseUrl: string,
): Promise<ApiPrismaTestHarness> {
  const dbHarness = createPrismaTestHarness(databaseUrl);
  await dbHarness.migrate();
  const logger = new InMemoryLogger();
  const metrics = new InMemoryMetricsRegistry();

  const app = await createApiApp({
    services: createPrismaBackedApiServices({ prisma: dbHarness.client, logger, metrics }),
  });

  return {
    app,
    prisma: dbHarness.client,
    logger,
    metrics,
    migrate: dbHarness.migrate,
    cleanup: dbHarness.cleanup,
    seedBaseContext: () => seedBaseContext(dbHarness.client),
    disconnect: async () => {
      await app.close();
      await dbHarness.disconnect();
    },
  };
}

async function seedBaseContext(prisma: PrismaClient): Promise<void> {
  await prisma.tenant.upsert({
    where: { id: "cedco-test" },
    create: {
      id: "cedco-test",
      name: "CEDCO Test",
      status: "active",
      locale: "es-CO",
      timezone: "America/Bogota",
      dataRetentionDays: 30,
      piiPolicy: {},
      metadata: {},
    },
    update: {
      name: "CEDCO Test",
      status: "active",
    },
  });

  await prisma.tenant.upsert({
    where: { id: "other-tenant" },
    create: {
      id: "other-tenant",
      name: "Other Tenant",
      status: "active",
      locale: "es-CO",
      timezone: "America/Bogota",
      dataRetentionDays: 30,
      piiPolicy: {},
      metadata: {},
    },
    update: {
      name: "Other Tenant",
      status: "active",
    },
  });

  await prisma.user.upsert({
    where: { id: "actor-test" },
    create: {
      id: "actor-test",
      displayName: "Synthetic Actor",
      status: "active",
      metadata: {},
    },
    update: {
      status: "active",
    },
  });

  await prisma.tenantMembership.upsert({
    where: { tenantId_userId: { tenantId: "cedco-test", userId: "actor-test" } },
    create: {
      id: "membership-cedco-test-actor-test",
      tenantId: "cedco-test",
      userId: "actor-test",
      roles: ["tenant-admin"],
      status: "active",
    },
    update: {
      roles: ["tenant-admin"],
      status: "active",
    },
  });
}
