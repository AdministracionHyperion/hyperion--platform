import { createTestActorContext, createTestOperationContext } from "../core/test-context-factory";

export function createAgentPlatformTestContext() {
  const context = createTestOperationContext({
    tenantId: "tenant-alpha",
    actorId: "actor-manager",
    correlationId: "corr-agent-platform-001",
  });
  const manager = createTestActorContext({
    tenantId: "tenant-alpha",
    actorId: "actor-manager",
    roles: ["voice-manager"],
  });
  const viewer = createTestActorContext({
    tenantId: "tenant-alpha",
    actorId: "actor-viewer",
    roles: ["tenant-viewer"],
  });

  return { context, manager, viewer };
}
