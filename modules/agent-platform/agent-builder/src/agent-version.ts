import type { Brand } from "../../../../packages/shared/src/core";
import type { AgentCapability } from "./agent-capability";
import type { AgentId } from "./agent-id";
import type { AgentVersionStatus } from "./agent-version-status";

export type AgentVersionId = Brand<string, "AgentVersionId">;

export interface AgentVersion {
  readonly agentVersionId: AgentVersionId;
  readonly tenantId: string;
  readonly agentId: AgentId;
  readonly versionNumber: number;
  readonly status: AgentVersionStatus;
  readonly promptVersionId?: string;
  readonly flowVersionId?: string;
  readonly knowledgeBaseVersionId?: string;
  readonly capabilities: readonly AgentCapability[];
  readonly createdBy: string;
  readonly createdAt: Date;
  readonly activatedAt?: Date;
}
