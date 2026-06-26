import type { SafeMetadata } from "../../../../../packages/shared/src/core";
import type { CedcoServiceId } from "./cedco-service-id";
import type { CedcoSiteId } from "./cedco-site-id";

export type CedcoD02IntegrationMode = "disabled" | "mock" | "integration";

export interface CedcoD02Configuration {
  readonly tenantId: string;
  readonly defaultLocale: "es-CO";
  readonly activeAgentVersionId?: string;
  readonly activePromptVersionId?: string;
  readonly activeFlowVersionId?: string;
  readonly activeKnowledgeBaseVersionId?: string;
  readonly allowedSiteIds: readonly CedcoSiteId[];
  readonly allowedServiceIds: readonly CedcoServiceId[];
  readonly handoffEnabled: boolean;
  readonly schedulingMode: CedcoD02IntegrationMode;
  readonly eligibilityMode: CedcoD02IntegrationMode;
  readonly realCallsEnabled: false;
  readonly metadata: SafeMetadata;
}
