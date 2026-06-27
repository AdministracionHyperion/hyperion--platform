import { evaluateAssetImportPolicy, type AssetImportReadiness } from "../asset-import-policy";

export interface EvaluateImportReadinessInput {
  readonly tenantId: string;
  readonly sourceKind: "manual-entry" | "file-upload" | "bulk-export";
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export function evaluateImportReadiness(input: EvaluateImportReadinessInput): AssetImportReadiness {
  return evaluateAssetImportPolicy(input);
}
