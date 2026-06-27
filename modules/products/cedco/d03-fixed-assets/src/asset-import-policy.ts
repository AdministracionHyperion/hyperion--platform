import { collectUnsafeAssetMetadataReasons } from "./asset-metadata";

export type AssetImportSourceKind = "manual-entry" | "file-upload" | "bulk-export";

export interface AssetImportReadinessInput {
  readonly tenantId: string;
  readonly sourceKind: AssetImportSourceKind;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface AssetImportReadiness {
  readonly ready: boolean;
  readonly blockedReasons: readonly string[];
  readonly allowedSourceKind: "manual-entry";
  readonly metadata: Readonly<Record<string, unknown>>;
}

export function evaluateAssetImportPolicy(input: AssetImportReadinessInput): AssetImportReadiness {
  const blockedReasons = new Set<string>();

  if (input.tenantId.trim().length === 0) {
    blockedReasons.add("tenant_required");
  }

  if (input.sourceKind !== "manual-entry") {
    blockedReasons.add("bulk_file_import_blocked");
  }

  for (const reason of collectUnsafeAssetMetadataReasons(input.metadata)) {
    blockedReasons.add(`unsafe_metadata:${reason}`);
  }

  return {
    ready: blockedReasons.size === 0,
    blockedReasons: [...blockedReasons].sort(),
    allowedSourceKind: "manual-entry",
    metadata: { importExportControls: "blocked-until-approved-loop" },
  };
}
