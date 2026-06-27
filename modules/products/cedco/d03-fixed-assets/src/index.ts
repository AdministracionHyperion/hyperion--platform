export const cedcoD03FixedAssetsLane = {
  product: "cedco",
  vertical: "d03-fixed-assets",
  status: "domain-contracts-enabled",
  functionalDomainImplemented: true,
  databaseImplemented: false,
  apiImplemented: false,
  dashboardImplemented: false,
} as const;

export * from "./asset-audit-event";
export * from "./asset-category";
export * from "./asset-category-id";
export * from "./asset-category-repository.port";
export * from "./asset-custodian-ref";
export * from "./asset-depreciation-policy";
export * from "./asset-import-policy";
export * from "./asset-location";
export * from "./asset-location-id";
export * from "./asset-location-repository.port";
export * from "./asset-maintenance-record";
export * from "./asset-metadata";
export * from "./asset-movement";
export * from "./asset-movement-policy";
export * from "./asset-status";
export * from "./asset-tag";
export * from "./fixed-asset";
export * from "./fixed-asset-data-policy";
export * from "./fixed-asset-id";
export * from "./fixed-asset-repository.port";
export * from "./use-cases/classify-fixed-asset";
export * from "./use-cases/evaluate-import-readiness";
export * from "./use-cases/move-fixed-asset";
export * from "./use-cases/record-maintenance";
export * from "./use-cases/register-fixed-asset";
