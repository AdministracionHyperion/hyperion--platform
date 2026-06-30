import type { PrismaClient } from "@prisma/client";
import { execFileSync } from "node:child_process";

import { createPrismaClient } from "../prisma/prisma-client";

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
    client.cedcoR02AgentCalendarBinding.deleteMany(),
    client.cedcoR02AgentKnowledgeBinding.deleteMany(),
    client.cedcoR02AgentToolPolicy.deleteMany(),
    client.cedcoR02AgentFlow.deleteMany(),
    client.cedcoR02VoiceAgentVersion.deleteMany(),
    client.cedcoR02VoiceAgent.deleteMany(),
    client.cedcoR02KnowledgeChunk.deleteMany(),
    client.cedcoR02KnowledgeDocumentVersion.deleteMany(),
    client.cedcoR02KnowledgeIngestionJob.deleteMany(),
    client.cedcoR02KnowledgeDocument.deleteMany(),
    client.cedcoR02KnowledgeBase.deleteMany(),
    client.cedcoR02CalendarSyncState.deleteMany(),
    client.cedcoR02Appointment.deleteMany(),
    client.cedcoR02AvailabilitySlot.deleteMany(),
    client.cedcoR02CalendarResource.deleteMany(),
    client.cedcoR02ServiceType.deleteMany(),
    client.cedcoR02HandoffTarget.deleteMany(),
    client.cedcoR02AuditEvent.deleteMany(),
    client.localAuthSession.deleteMany(),
    client.localAuthCredential.deleteMany(),
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
