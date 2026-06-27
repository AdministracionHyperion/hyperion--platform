import type { FeatureFlag } from "../../../../modules/core/feature-flags/src/feature-flag";
import type { FeatureFlagRepositoryPort } from "../../../../modules/core/feature-flags/src/feature-flag-repository.port";

export class InMemoryFeatureFlagRepository implements FeatureFlagRepositoryPort {
  private readonly flags = new Map<string, FeatureFlag>();

  async save(flag: FeatureFlag): Promise<void> {
    this.flags.set(toFlagKey(flag.flagKey, flag.tenantId), flag);
  }

  async findByKey(flagKey: string, tenantId?: string): Promise<FeatureFlag | null> {
    return this.flags.get(toFlagKey(flagKey, tenantId)) ?? null;
  }
}

function toFlagKey(flagKey: string, tenantId?: string): string {
  return tenantId ? `${tenantId}:${flagKey}` : `global:${flagKey}`;
}
