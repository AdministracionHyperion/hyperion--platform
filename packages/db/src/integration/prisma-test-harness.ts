import type { PrismaClient } from "@prisma/client";
// @ts-expect-error Node typings are intentionally not added for the repo; this file is integration-only.
import { execFileSync } from "node:child_process";

import { createPrismaClient } from "../prisma/prisma-client";

interface NodeProcessLike {
  readonly env: Readonly<Record<string, string | undefined>>;
  readonly platform: string;
}

declare const process: NodeProcessLike;

export interface PrismaTestHarness {
  readonly client: PrismaClient;
  readonly migrate: () => Promise<void>;
  readonly cleanup: () => Promise<void>;
  readonly disconnect: () => Promise<void>;
}

export function createPrismaTestHarness(databaseUrl: string): PrismaTestHarness {
  const client = createPrismaClient({ databaseUrl });

  return {
    client,
    migrate: () => runPrismaMigrateDeploy(databaseUrl),
    cleanup: () => cleanupDatabase(client),
    disconnect: () => client.$disconnect(),
  };
}

async function runPrismaMigrateDeploy(databaseUrl: string): Promise<void> {
  const prismaArgs = [
    "exec",
    "prisma",
    "migrate",
    "deploy",
    "--schema",
    "packages/db/prisma/schema.prisma",
  ];
  const command = process.platform === "win32" ? "cmd.exe" : "pnpm";
  const args = process.platform === "win32" ? ["/c", "pnpm", ...prismaArgs] : prismaArgs;

  execFileSync(command, args, {
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: "inherit",
  });
}

async function cleanupDatabase(client: PrismaClient): Promise<void> {
  await client.$transaction([
    client.tenantMembership.deleteMany(),
    client.auditLog.deleteMany(),
    client.featureFlag.deleteMany(),
    client.versionedResource.deleteMany(),
    client.feedbackEvent.deleteMany(),
    client.outboxEvent.deleteMany(),
    client.agentDeployment.deleteMany(),
    client.agentVersion.deleteMany(),
    client.agent.deleteMany(),
    client.promptVersion.deleteMany(),
    client.promptTemplate.deleteMany(),
    client.flowVersion.deleteMany(),
    client.flowDefinition.deleteMany(),
    client.knowledgeChunk.deleteMany(),
    client.knowledgeDocument.deleteMany(),
    client.knowledgeBaseVersion.deleteMany(),
    client.knowledgeBase.deleteMany(),
    client.evalResult.deleteMany(),
    client.evalRun.deleteMany(),
    client.evalScenario.deleteMany(),
    client.callParticipant.deleteMany(),
    client.conversationTurn.deleteMany(),
    client.callEvent.deleteMany(),
    client.providerCallEvent.deleteMany(),
    client.postCallResult.deleteMany(),
    client.handoffAssignment.deleteMany(),
    client.handoffRequest.deleteMany(),
    client.callSession.deleteMany(),
    client.cedcoSite.deleteMany(),
    client.cedcoService.deleteMany(),
    client.cedcoAgreement.deleteMany(),
    client.cedcoD02Configuration.deleteMany(),
    client.cedcoSchedulingRequest.deleteMany(),
    client.cedcoEligibilityCheck.deleteMany(),
    client.cedcoD02EvalScenario.deleteMany(),
    client.cedcoD02Metric.deleteMany(),
    client.user.deleteMany(),
    client.tenant.deleteMany(),
  ]);
}
