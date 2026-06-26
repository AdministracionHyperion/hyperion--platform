import { type SafeMetadata } from "../../../../packages/shared/src/core";
import type { LatencyBudget } from "./latency-budget";
import type { VoiceLocale } from "./voice-locale";

export interface SpeechProviderConfig {
  readonly providerAlias: string;
  readonly locale: VoiceLocale;
  readonly latencyBudget: LatencyBudget;
  readonly metadata: SafeMetadata;
}
