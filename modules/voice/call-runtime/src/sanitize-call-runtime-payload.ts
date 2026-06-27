import {
  fail,
  domainError,
  ok,
  sanitizeMetadata,
  type DomainError,
  type Result,
  type SafeMetadata,
} from "../../../../packages/shared/src/core";

const forbiddenRuntimeKeys = new Set([
  "phoneNumber",
  "phone",
  "to_number",
  "from_number",
  "rawTranscript",
  "transcript",
  "audioUrl",
  "recordingUrl",
  "email",
  "documentNumber",
  "apiKey",
  "token",
  "secret",
  "password",
  "realCallsEnabled",
  "providerEgressEnabled",
  "productionDeployEnabled",
  "rawTranscriptEnabled",
  "rawRecordingEnabled",
]);

export function sanitizeCallRuntimePayload(
  payload: Readonly<Record<string, unknown>> = {},
): Result<SafeMetadata, DomainError> {
  const forbiddenPath = findForbiddenRuntimeKey(payload);
  if (forbiddenPath) {
    return fail({
      ...domainError(
        "invalid_metadata",
        `call runtime payload contains forbidden field ${forbiddenPath}`,
      ),
    });
  }

  return ok(sanitizeMetadata(payload));
}

export function findForbiddenRuntimeKey(value: unknown, path = "payload"): string | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  if (Array.isArray(value)) {
    for (const [index, item] of value.entries()) {
      const nested = findForbiddenRuntimeKey(item, `${path}.${index}`);
      if (nested) {
        return nested;
      }
    }
    return undefined;
  }

  for (const [key, nestedValue] of Object.entries(value as Record<string, unknown>)) {
    const currentPath = `${path}.${key}`;
    if (forbiddenRuntimeKeys.has(key)) {
      return currentPath;
    }

    const nested = findForbiddenRuntimeKey(nestedValue, currentPath);
    if (nested) {
      return nested;
    }
  }

  return undefined;
}
