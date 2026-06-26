import type { SafeMetadata } from "../../../../packages/shared/src/core";
import type { AgentId } from "./agent-id";
import type { AgentStatus } from "./agent-status";

export interface Agent {
  readonly agentId: AgentId;
  readonly tenantId: string;
  readonly name: string;
  readonly description: string;
  readonly status: AgentStatus;
  readonly defaultLocale: string;
  readonly createdBy: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly metadata: SafeMetadata;
}
