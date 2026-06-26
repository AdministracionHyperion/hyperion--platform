import type { VoiceProfile } from "./voice-profile";

export interface SpeechSynthesisRequest {
  readonly tenantId: string;
  readonly textRedacted: string;
  readonly voiceProfile: VoiceProfile;
}
