import { sanitizeMetadata } from "../../../../packages/shared/src/core";
import { toPrismaJson } from "../../../../packages/db/src";

export function metadataToPrismaJson(metadata: Readonly<Record<string, unknown>> = {}) {
  return toPrismaJson(sanitizeMetadata(metadata));
}

export function arrayToPrismaJson(values: readonly string[] = []) {
  return toPrismaJson(values);
}

export function persistedJsonArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map((item) => String(item)) : [];
}

export function persistedMetadata(value: unknown) {
  return sanitizeMetadata(
    value && typeof value === "object" ? (value as Record<string, unknown>) : {},
  );
}
