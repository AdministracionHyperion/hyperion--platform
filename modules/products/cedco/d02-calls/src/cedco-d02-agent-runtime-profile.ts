import type { SafeMetadata } from "../../../../../packages/shared/src/core";
import type { VoiceLocale } from "../../../../voice/speech/src";

export interface CedcoD02AgentRuntimeProfile {
  readonly tenantId: string;
  readonly agentVersionId: string;
  readonly promptVersionId?: string;
  readonly flowVersionId?: string;
  readonly knowledgeBaseVersionId?: string;
  readonly voiceLocale: VoiceLocale;
  readonly capabilities: readonly string[];
  readonly metadata: SafeMetadata;
}
