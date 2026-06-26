import { createTestActorContext, createTestOperationContext } from "../../../core";
import {
  createCedcoServiceId,
  createCedcoSiteId,
  type CedcoD02Configuration,
} from "../../../../../../modules/products/cedco/d02-calls/src";

export function createCedcoD02TestContext() {
  const context = createTestOperationContext({
    tenantId: "tenant-alpha",
    actorId: "actor-admin",
    correlationId: "corr-cedco-d02-001",
  });
  const admin = createTestActorContext({
    tenantId: "tenant-alpha",
    actorId: "actor-admin",
    roles: ["tenant-admin"],
  });
  const viewer = createTestActorContext({
    tenantId: "tenant-alpha",
    actorId: "actor-viewer",
    roles: ["tenant-viewer"],
  });

  return { context, admin, viewer };
}

export function createCedcoD02TestConfiguration(
  overrides: Partial<CedcoD02Configuration> = {},
): CedcoD02Configuration {
  const bucaramanga = createCedcoSiteId("bucaramanga");
  const service = createCedcoServiceId("general-orientation");
  if (!bucaramanga.ok || !service.ok) {
    throw new Error("test IDs should be valid");
  }

  return {
    tenantId: "tenant-alpha",
    defaultLocale: "es-CO",
    activeAgentVersionId: "agent-version-test",
    activePromptVersionId: "prompt-version-test",
    activeFlowVersionId: "flow-version-test",
    activeKnowledgeBaseVersionId: "knowledge-version-test",
    allowedSiteIds: [bucaramanga.value],
    allowedServiceIds: [service.value],
    handoffEnabled: true,
    schedulingMode: "mock",
    eligibilityMode: "mock",
    realCallsEnabled: false,
    metadata: {},
    ...overrides,
  };
}
