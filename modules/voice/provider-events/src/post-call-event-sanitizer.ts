import {
  fail,
  ok,
  sanitizeMetadata,
  type DomainError,
  type Result,
  type SafeMetadata,
} from "../../../../packages/shared/src/core";
import { providerEventValidationError } from "./provider-event-error";

const maxPayloadBytes = 16_384;

const forbiddenProviderEventKeys = new Set([
  "phone",
  "phoneNumber",
  "to_number",
  "from_number",
  "rawPayload",
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
  "audioBase64",
  "binaryPayload",
  "payloadBase64",
]);

export function sanitizeProviderEventPayload(
  payload: Readonly<Record<string, unknown>> = {},
): Result<SafeMetadata, DomainError> {
  const serialized = JSON.stringify(payload);
  if (serialized.length > maxPayloadBytes) {
    return fail(providerEventValidationError("provider event payload exceeds safe size limit"));
  }

  const forbiddenPath = findForbiddenProviderEventKey(payload);
  if (forbiddenPath) {
    return fail(
      providerEventValidationError(
        `provider event payload contains forbidden field ${forbiddenPath}`,
      ),
    );
  }

  if (containsLikelyBinaryPayload(payload)) {
    return fail(providerEventValidationError("provider event payload contains binary-like data"));
  }

  return ok(sanitizeMetadata(payload));
}

export function findForbiddenProviderEventKey(
  value: unknown,
  path = "payload",
): string | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  if (Array.isArray(value)) {
    for (const [index, item] of value.entries()) {
      const nested = findForbiddenProviderEventKey(item, `${path}.${index}`);
      if (nested) {
        return nested;
      }
    }
    return undefined;
  }

  for (const [key, nestedValue] of Object.entries(value as Record<string, unknown>)) {
    const currentPath = `${path}.${key}`;
    if (forbiddenProviderEventKeys.has(key)) {
      return currentPath;
    }
    const nested = findForbiddenProviderEventKey(nestedValue, currentPath);
    if (nested) {
      return nested;
    }
  }
  return undefined;
}

function containsLikelyBinaryPayload(value: unknown): boolean {
  if (typeof value === "string") {
    return value.length > 512 && /^[A-Za-z0-9+/=]+$/u.test(value);
  }
  if (Array.isArray(value)) {
    return value.some((item) => containsLikelyBinaryPayload(item));
  }
  if (value && typeof value === "object") {
    return Object.values(value as Record<string, unknown>).some((nested) =>
      containsLikelyBinaryPayload(nested),
    );
  }
  return false;
}
