import {
  domainError,
  fail,
  ok,
  type DomainError,
  type Result,
} from "../../../../packages/shared/src/core";

export interface PromptPolicy {
  readonly allowPii: false;
  readonly allowSecrets: false;
  readonly allowProviderSpecificKeys: false;
  readonly allowHardcodedPhoneNumbers: false;
}

export const defaultPromptPolicy: PromptPolicy = {
  allowPii: false,
  allowSecrets: false,
  allowProviderSpecificKeys: false,
  allowHardcodedPhoneNumbers: false,
};

const forbiddenPromptPatterns: readonly RegExp[] = [
  /\b(secret|password|token)\b\s*[:=]/iu,
  /\b(apiKey|api_key)\b\s*[:=]/iu,
  /\b(openai|anthropic|elevenlabs|twilio)[_-]?key\b/iu,
  /\+?\d[\d\s().-]{7,}\d/u,
  /\b(patient|documentNumber|rawTranscript|recordingUrl)\b/iu,
];

export function validatePromptPolicy(template: string): Result<true, DomainError> {
  for (const pattern of forbiddenPromptPatterns) {
    if (pattern.test(template)) {
      return fail(domainError("invalid_metadata", "prompt template violates prompt policy"));
    }
  }

  return ok(true);
}
