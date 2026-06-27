import {
  isSensitiveMetadataKey,
  sanitizeMetadata,
  type SafeMetadata,
} from "../../../../packages/shared/src/core";
import type { PolicyGateReason } from "./policy-gate-reason";
import type { RuntimeSafetyFlags } from "./runtime-safety-flags";

const rawTranscriptKeys = new Set(["rawtranscript", "raw_transcript", "transcript"]);
const rawRecordingKeys = new Set(["audiourl", "audio_url", "recordingurl", "recording_url"]);

export interface DataExposureEvaluation {
  readonly reasons: readonly PolicyGateReason[];
  readonly metadata: SafeMetadata;
}

export function evaluateDataExposurePolicy(input: {
  readonly flags: RuntimeSafetyFlags;
  readonly metadata?: Readonly<Record<string, unknown>>;
}): DataExposureEvaluation {
  const reasons = new Set<PolicyGateReason>();
  inspectMetadata(input.metadata ?? {}, input.flags, reasons);

  return {
    reasons: [...reasons],
    metadata: sanitizeMetadata(input.metadata),
  };
}

function inspectMetadata(
  metadata: Readonly<Record<string, unknown>>,
  flags: RuntimeSafetyFlags,
  reasons: Set<PolicyGateReason>,
): void {
  for (const [key, value] of Object.entries(metadata)) {
    const normalized = key.replace(/[^a-zA-Z0-9_]/gu, "").toLowerCase();

    if (rawTranscriptKeys.has(normalized) && !flags.rawTranscriptEnabled) {
      reasons.add("raw_transcript_disabled");
    }

    if (rawRecordingKeys.has(normalized) && !flags.rawRecordingEnabled) {
      reasons.add("raw_recording_disabled");
    }

    if (isSensitiveMetadataKey(key)) {
      reasons.add("data_export_disabled");
    }

    if (value && typeof value === "object" && !Array.isArray(value)) {
      inspectMetadata(value as Record<string, unknown>, flags, reasons);
    }
  }
}
