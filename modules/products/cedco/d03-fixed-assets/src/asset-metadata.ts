import {
  domainError,
  fail,
  isSensitiveMetadataKey,
  ok,
  sanitizeMetadata,
  type Brand,
  type DomainError,
  type MetadataValue,
  type Result,
  type SafeMetadata,
} from "../../../../../packages/shared/src/core";

export type AssetMetadata = SafeMetadata & Brand<SafeMetadata, "AssetMetadata">;

const prohibitedD03MetadataTerms = [
  "serial",
  "invoice",
  "factura",
  "photo",
  "image",
  "spreadsheet",
  "file",
  "import",
  "export",
  "responsible",
  "supplier",
  "vendor",
] as const;

const externalUrlPattern = /https?:\/\//iu;
const phoneLikePattern = /\+?[1-9][0-9][0-9\s().-]{6,}[0-9]/u;
const emailLikePattern = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/iu;

export function createAssetMetadata(
  metadata: Readonly<Record<string, unknown>> = {},
): Result<AssetMetadata, DomainError> {
  const reasons = collectUnsafeAssetMetadataReasons(metadata);
  if (reasons.length > 0) {
    return fail(
      domainError(
        "invalid_metadata",
        `D03 asset metadata contains blocked fields: ${reasons.join(", ")}`,
      ),
    );
  }

  return ok(sanitizeMetadata(metadata) as AssetMetadata);
}

export function collectUnsafeAssetMetadataReasons(
  metadata: Readonly<Record<string, unknown>> = {},
): readonly string[] {
  const reasons = new Set<string>();
  inspectMetadata(metadata, reasons);
  return [...reasons].sort();
}

function inspectMetadata(value: unknown, reasons: Set<string>, key = "metadata"): void {
  if (Array.isArray(value)) {
    for (const [index, item] of value.entries()) {
      inspectMetadata(item, reasons, `${key}.${index}`);
    }
    return;
  }

  if (value && typeof value === "object") {
    for (const [childKey, childValue] of Object.entries(value as Record<string, unknown>)) {
      const normalized = normalizeKey(childKey);
      if (isSensitiveMetadataKey(childKey) || containsProhibitedD03Term(normalized)) {
        reasons.add(childKey);
      }
      inspectMetadata(childValue, reasons, childKey);
    }
    return;
  }

  if (typeof value === "string") {
    if (externalUrlPattern.test(value)) {
      reasons.add(`${key}:external-url`);
    }
    if (phoneLikePattern.test(value)) {
      reasons.add(`${key}:phone-like`);
    }
    if (emailLikePattern.test(value)) {
      reasons.add(`${key}:email-like`);
    }
  }
}

function normalizeKey(key: string): string {
  return key.replace(/[^a-zA-Z0-9]/gu, "").toLowerCase();
}

function containsProhibitedD03Term(normalizedKey: string): boolean {
  return prohibitedD03MetadataTerms.some((term) => normalizedKey.includes(term));
}

export function toAssetMetadataValue(
  metadata: AssetMetadata,
): Readonly<Record<string, MetadataValue>> {
  return metadata;
}
