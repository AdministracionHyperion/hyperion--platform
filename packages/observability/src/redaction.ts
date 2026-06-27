export type SanitizedLogMetadataValue =
  | string
  | number
  | boolean
  | null
  | SanitizedLogMetadataValue[]
  | { readonly [key: string]: SanitizedLogMetadataValue };

export type SanitizedLogMetadata = Readonly<Record<string, SanitizedLogMetadataValue>>;

export const redactedLogValue = "[REDACTED]";

const sensitiveLogKeys = new Set([
  "phone",
  "phonenumber",
  "to_number",
  "tonumber",
  "from_number",
  "fromnumber",
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
  "authorization",
  "cookie",
  "setcookie",
  "set-cookie",
]);

export function isSensitiveLogKey(key: string): boolean {
  const normalized = key.replace(/[^a-zA-Z0-9_-]/gu, "").toLowerCase();
  return sensitiveLogKeys.has(normalized);
}

export function redactSensitiveValue(key: string, value: unknown): SanitizedLogMetadataValue {
  if (isSensitiveLogKey(key)) {
    return redactedLogValue;
  }

  return sanitizeLogValue(value);
}

export function sanitizeLogMetadata(
  metadata: Readonly<Record<string, unknown>> = {},
): SanitizedLogMetadata {
  const sanitized: Record<string, SanitizedLogMetadataValue> = {};

  for (const [key, value] of Object.entries(metadata)) {
    sanitized[key] = redactSensitiveValue(key, value);
  }

  return sanitized;
}

function sanitizeLogValue(value: unknown): SanitizedLogMetadataValue {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeLogValue(item));
  }

  if (typeof value === "object") {
    const nested: Record<string, SanitizedLogMetadataValue> = {};

    for (const [key, nestedValue] of Object.entries(value as Record<string, unknown>)) {
      nested[key] = redactSensitiveValue(key, nestedValue);
    }

    return nested;
  }

  return String(value);
}
