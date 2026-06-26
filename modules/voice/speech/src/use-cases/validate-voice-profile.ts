import {
  domainError,
  fail,
  ok,
  type DomainError,
  type Result,
} from "../../../../../packages/shared/src/core";
import type { VoiceProfile } from "../voice-profile";
import { isSupportedVoiceLocale } from "../voice-locale";

export function validateVoiceProfile(profile: VoiceProfile): Result<true, DomainError> {
  if (profile.voiceProfileId.trim().length === 0) {
    return fail(domainError("invalid_id", "voiceProfileId is required"));
  }

  if (profile.tenantId.trim().length === 0) {
    return fail(domainError("invalid_id", "tenantId is required"));
  }

  if (!isSupportedVoiceLocale(profile.locale)) {
    return fail(domainError("invalid_state", "voice locale is not supported"));
  }

  return ok(true);
}
