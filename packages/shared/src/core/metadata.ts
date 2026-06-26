import { domainError, type DomainError } from "./errors";
import { fail, ok, type Result } from "./result";

export type MetadataPrimitive = string | number | boolean | null;
export type MetadataValue =
  | MetadataPrimitive
  | readonly MetadataValue[]
  | { readonly [key: string]: MetadataValue };
export type SafeMetadata = Readonly<Record<string, MetadataValue>>;

export const redactedMetadataValue = "[REDACTED]";

const sensitiveMetadataKeys = new Set([
  "phone",
  "phonenumber",
  "to_number",
  "tonumber",
  "email",
  "document",
  "documentnumber",
  "password",
  "secret",
  "token",
  "apikey",
  "api_key",
  "rawtranscript",
  "raw_transcript",
  "transcript",
  "audiourl",
  "audio_url",
  "recordingurl",
  "recording_url",
]);

export function isSensitiveMetadataKey(key: string): boolean {
  const normalized = key.replace(/[^a-zA-Z0-9_]/gu, "").toLowerCase();
  return sensitiveMetadataKeys.has(normalized);
}

export function sanitizeMetadata(metadata: Readonly<Record<string, unknown>> = {}): SafeMetadata {
  const sanitized: Record<string, MetadataValue> = {};

  for (const [key, value] of Object.entries(metadata)) {
    sanitized[key] = isSensitiveMetadataKey(key)
      ? redactedMetadataValue
      : sanitizeMetadataValue(value);
  }

  return sanitized;
}

export function createSafeMetadata(
  metadata: Readonly<Record<string, unknown>> = {},
): Result<SafeMetadata, DomainError> {
  try {
    return ok(sanitizeMetadata(metadata));
  } catch {
    return fail(domainError("invalid_metadata", "metadata contains unsupported values"));
  }
}

function sanitizeMetadataValue(value: unknown): MetadataValue {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeMetadataValue(item));
  }

  if (typeof value === "object") {
    const nested: Record<string, MetadataValue> = {};

    for (const [key, nestedValue] of Object.entries(value as Record<string, unknown>)) {
      nested[key] = isSensitiveMetadataKey(key)
        ? redactedMetadataValue
        : sanitizeMetadataValue(nestedValue);
    }

    return nested;
  }

  return String(value);
}
