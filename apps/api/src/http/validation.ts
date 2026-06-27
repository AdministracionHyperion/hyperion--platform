import { z, type ZodType } from "zod";
import { validationError } from "./api-error";

const forbiddenPayloadKeys = new Set([
  "phone",
  "phoneNumber",
  "to_number",
  "rawTranscript",
  "audioUrl",
  "recordingUrl",
  "apiKey",
  "token",
  "secret",
]);

export function assertNoForbiddenPayloadFields(value: unknown, path: string[] = []): void {
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoForbiddenPayloadFields(item, [...path, String(index)]));
    return;
  }

  if (!value || typeof value !== "object") {
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
