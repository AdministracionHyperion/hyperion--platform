export interface AssetDepreciationPolicyResult {
  readonly supported: false;
  readonly blockedReasons: readonly string[];
}

export function evaluateAssetDepreciationPolicy(): AssetDepreciationPolicyResult {
  return {
    supported: false,
    blockedReasons: ["depreciation_rules_pending_future_loop"],
  };
}
