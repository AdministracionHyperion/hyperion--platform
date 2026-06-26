import { type SafeMetadata } from "../../../../packages/shared/src/core";
import type { VoiceLocale } from "./voice-locale";

export interface VoiceProfile {
  readonly voiceProfileId: string;
  readonly tenantId: string;
  readonly locale: VoiceLocale;
  readonly displayName: string;
  readonly providerAlias?: string;
  readonly metadata: SafeMetadata;
}
