import {
  domainError,
  fail,
  isSensitiveMetadataKey,
  ok,
  type DomainError,
  type Result,
} from "../../../../packages/shared/src/core";

export interface CallDataPolicy {
  readonly allowPhoneInMetadata: false;
  readonly allowRawTranscript: false;
  readonly allowRawAudioUrl: false;
  readonly allowSecrets: false;
  readonly allowCrossTenant: false;
}

export const defaultCallDataPolicy: CallDataPolicy = {
  allowPhoneInMetadata: false,
  allowRawTranscript: false,
  allowRawAudioUrl: false,
  allowSecrets: false,
  allowCrossTenant: false,
};

export function validateVoiceMetadataKeys(
  metadata: Readonly<Record<string, unknown>> = {},
): Result<true, DomainError> {
  for (const key of Object.keys(metadata)) {
    if (isSensitiveMetadataKey(key) || key === "from_number") {
      return fail(domainError("invalid_metadata", `voice metadata contains sensitive key ${key}`));
    }
  }

  return ok(true);
}
