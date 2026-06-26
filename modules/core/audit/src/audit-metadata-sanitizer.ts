import { sanitizeMetadata, type SafeMetadata } from "../../../../packages/shared/src/core";

export function sanitizeAuditMetadata(
  metadata: Readonly<Record<string, unknown>> = {},
): SafeMetadata {
  return sanitizeMetadata(metadata);
}
