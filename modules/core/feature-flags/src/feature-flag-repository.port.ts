import type { FeatureFlag } from "./feature-flag";

export interface FeatureFlagRepositoryPort {
  save(flag: FeatureFlag): Promise<void>;
  findByKey(flagKey: string, tenantId?: string): Promise<FeatureFlag | null>;
}
