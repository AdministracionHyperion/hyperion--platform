import type { Prisma, PrismaClient } from "@prisma/client";
import { sanitizeMetadata, type SafeMetadata } from "../../../shared/src/core";

export type HyperionPrismaClient = PrismaClient;
export type PrismaJson = Prisma.JsonValue;
export type PrismaInputJson = Prisma.InputJsonValue;

export function toPrismaJson(value: unknown): PrismaInputJson {
  return JSON.parse(JSON.stringify(value ?? {})) as PrismaInputJson;
}

export function toSafeMetadata(value: unknown): SafeMetadata {
  if (!value || typeof value !== "object") {
    return sanitizeMetadata();
  }

  return sanitizeMetadata(value as Readonly<Record<string, unknown>>);
}

export function toStringArray(value: unknown): readonly string[] {
  return Array.isArray(value) ? value.map((item) => String(item)) : [];
}

export function fromPersistedRow<T>(mapper: (row: never) => T, row: unknown): T {
  return mapper(row as never);
}

export function fromPersistedRows<T>(mapper: (row: never) => T, rows: readonly unknown[]): T[] {
  return rows.map((row) => fromPersistedRow(mapper, row));
}
