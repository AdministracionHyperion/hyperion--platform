export type VoiceLocale = "es-CO" | "en-US";

export const defaultVoiceLocale: VoiceLocale = "es-CO";

export function isSupportedVoiceLocale(value: string): value is VoiceLocale {
  return value === "es-CO" || value === "en-US";
}
