const forbiddenKeys = new Set([
  "phone",
  "phonenumber",
  "to_number",
  "from_number",
  "rawtranscript",
  "transcript",
  "audiourl",
  "recordingurl",
  "email",
  "documentnumber",
  "apikey",
  "token",
  "secret",
  "password",
  "rawpayload",
]);

const blockedValuePatterns = [
  /https?:\/\/[^"'\s]*(?:elevenlabs|twilio|telnyx|plivo|vonage|sip)[^"'\s]*/iu,
  /\bagent_[a-z0-9_-]{8,}\b/iu,
  /\bphone_number_[a-z0-9_-]{8,}\b/iu,
];

export function sanitizeDashboardData<T>(value: T): T {
  return sanitizeValue(value) as T;
}

function sanitizeValue(value: unknown): unknown {
  if (value === null || typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    return blockedValuePatterns.some((pattern) => pattern.test(value)) ? "[REDACTED]" : value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item));
  }

  if (typeof value === "object") {
    const sanitized: Record<string, unknown> = {};
    for (const [key, nestedValue] of Object.entries(value as Record<string, unknown>)) {
      if (isForbiddenKey(key)) {
        continue;
      }
      sanitized[key] = sanitizeValue(nestedValue);
    }
    return sanitized;
  }

  return String(value);
}

function isForbiddenKey(key: string): boolean {
  return forbiddenKeys.has(key.replace(/[^a-zA-Z0-9_]/gu, "").toLowerCase());
}
