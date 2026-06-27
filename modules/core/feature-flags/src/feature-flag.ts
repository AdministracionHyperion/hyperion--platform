export interface FeatureFlag {
  readonly flagKey: string;
  readonly tenantId?: string;
  readonly enabled: boolean;
  readonly description: string;
  readonly createdAt: Date;
}
