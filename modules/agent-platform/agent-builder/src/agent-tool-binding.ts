import type { AgentCapability } from "./agent-capability";

export interface AgentToolBinding {
  readonly toolKey: string;
  readonly capability: AgentCapability;
  readonly enabled: boolean;
}
