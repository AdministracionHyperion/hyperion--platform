import { createTestOperationContext } from "../../../core";
import type { OperationContext } from "../../../../../shared/src/core";

export function createCedcoD03TestContext(
  overrides: Partial<OperationContext> = {},
): OperationContext {
  return {
    ...createTestOperationContext({
      tenantId: "cedco-d03-test",
      actorId: "actor-d03-test",
      correlationId: "corr-d03-test-001",
      source: "d03-domain-test",
    }),
    ...overrides,
  };
}

export function createCedcoD03SafeAssetInput() {
  return {
    assetId: "asset-d03-test-001",
    tag: "tag-d03-test-001",
    categoryId: "category-equipment-test",
    locationId: "location-bodega-test",
    custodianRef: "custodian-ref-test",
    description: "Synthetic fixed asset for D03 domain tests",
    metadata: {
      source: "synthetic",
      containsRealData: false,
    },
  } as const;
}
