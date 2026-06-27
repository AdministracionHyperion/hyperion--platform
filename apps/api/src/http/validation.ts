import { z, type ZodType } from "zod";
import { validationError } from "./api-error";

const forbiddenPayloadKeys = new Set([
  "phone",
  "phoneNumber",
  "to_number",
  "from_number",
  "rawTranscript",
  "transcript",
  "audioUrl",
  "recordingUrl",
  "rawPayload",
  "email",
  "documentNumber",
  "apiKey",
  "token",
  "secret",
  "password",
  "agent_id",
  "phone_number_id",
]);

const providerUrlPattern = /https?:\/\/[^"'\s]*(?:elevenlabs|twilio|sip|api\.)[^"'\s]*/iu;

export function assertNoForbiddenPayloadFields(value: unknown, path: string[] = []): void {
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoForbiddenPayloadFields(item, [...path, String(index)]));
    return;
  }

  if (!value || typeof value !== "object") {
    if (typeof value === "string" && providerUrlPattern.test(value)) {
      throw validationError("Payload contains a forbidden provider URL.", {
        field: path.join(".") || "payload",
      });
    }
    return;
  }

  for (const [key, nestedValue] of Object.entries(value as Record<string, unknown>)) {
    if (forbiddenPayloadKeys.has(key)) {
      throw validationError("Payload contains a forbidden field.", {
        field: [...path, key].join("."),
      });
    }
    assertNoForbiddenPayloadFields(nestedValue, [...path, key]);
  }
}

export function validateWithSchema<T>(schema: ZodType<T>, value: unknown): T {
  assertNoForbiddenPayloadFields(value);
  const result = schema.safeParse(value);
  if (!result.success) {
    throw validationError("Request validation failed.", z.treeifyError(result.error));
  }
  return result.data;
}
