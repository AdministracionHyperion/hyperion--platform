import type { FeatureFlagRepositoryPort } from "../feature-flag-repository.port";

export interface EvaluateFeatureFlagInput {
  readonly flagKey: string;
  readonly tenantId?: string;
  readonly repository: FeatureFlagRepositoryPort;
}

export async function evaluateFeatureFlag(input: EvaluateFeatureFlagInput): Promise<boolean> {
  if (input.tenantId) {
    const tenantScoped = await input.repository.findByKey(input.flagKey, input.tenantId);
    if (tenantScoped) {
      return tenantScoped.enabled;
    }
  }

  const global = await input.repository.findByKey(input.flagKey);
  return global?.enabled ?? false;
}
