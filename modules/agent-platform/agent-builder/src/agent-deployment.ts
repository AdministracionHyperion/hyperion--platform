import type { Brand } from "../../../../packages/shared/src/core";
import type { AgentEnvironment } from "./agent-environment";
import type { AgentId } from "./agent-id";
import type { AgentVersionId } from "./agent-version";

export type AgentDeploymentId = Brand<string, "AgentDeploymentId">;
export type AgentDeploymentStatus = "pending" | "active" | "rolled_back" | "failed";

export interface AgentDeployment {
  readonly deploymentId: AgentDeploymentId;
  readonly tenantId: string;
  readonly agentId: AgentId;
  readonly agentVersionId: AgentVersionId;
  readonly environment: AgentEnvironment;
  readonly status: AgentDeploymentStatus;
  readonly deployedBy: string;
  readonly deployedAt: Date;
}
