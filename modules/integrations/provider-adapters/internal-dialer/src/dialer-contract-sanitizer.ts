import { sanitizeMetadata, type SafeMetadata } from "../../../../../packages/shared/src/core";
import type { DialerBlockedReason } from "./dialer-blocked-reason";

const forbiddenKeyPattern =
  /(?:phoneNumber|phone|to_number|from_number|phoneE164Persisted|rawTranscript|transcript|audioUrl|recordingUrl|rawPayload|email|documentNumber|apiKey|token|secret|password)/iu;
const realProviderIdPattern =
  /\b(?:agent_id|phone_number_id)\b|(?:agent|phone)[_-]?[a-z0-9]{16,}/iu;
const externalUrlPattern = /https?:\/\//iu;
const phonePattern = /\+[1-9][0-9]{7,14}\b/u;

export interface DialerSanitizationResult {
  readonly ok: boolean;
  readonly reasons: readonly DialerBlockedReason[];
  readonly metadata: SafeMetadata;
}

export function sanitizeDialerContractPayload(
  value: unknown,
  inputReasons: readonly DialerBlockedReason[] = [],
): DialerSanitizationResult {
  const json = JSON.stringify(value ?? {});
  const reasons = new Set<DialerBlockedReason>(inputReasons);

  if (
    forbiddenKeyPattern.test(json) ||
    realProviderIdPattern.test(json) ||
    externalUrlPattern.test(json) ||
    phonePattern.test(json)
  ) {
    reasons.add("unsafe_payload");
  }

  return {
    ok: reasons.size === 0,
    reasons: [...reasons],
    metadata: sanitizeMetadata(value as Readonly<Record<string, unknown>>),
  };
}
