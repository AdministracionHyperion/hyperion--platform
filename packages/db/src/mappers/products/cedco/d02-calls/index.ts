import type {
  CedcoAgreement,
  CedcoD02Configuration,
  CedcoD02Metric,
  CedcoService,
  CedcoSite,
} from "../../../../../../../modules/products/cedco/d02-calls/src";
import { sanitizeMetadata } from "../../../../../../shared/src/core";
import { toPrismaJson, toSafeMetadata, toStringArray } from "../../../../prisma/prisma-types";

export const cedcoSiteToPrisma = (site: CedcoSite) => ({
  id: site.siteId,
  tenantId: site.tenantId,
  name: site.name,
  city: site.city,
  status: site.status,
  timezone: site.timezone,
  metadata: toPrismaJson(sanitizeMetadata(site.metadata)),
  createdAt: new Date(0),
  updatedAt: new Date(0),
});

export const cedcoSiteFromPrisma = (row: ReturnType<typeof cedcoSiteToPrisma>): CedcoSite => ({
  siteId: row.id as CedcoSite["siteId"],
  tenantId: row.tenantId,
  name: row.name,
  city: row.city,
  status: row.status as CedcoSite["status"],
  timezone: row.timezone,
  metadata: toSafeMetadata(row.metadata),
});

export const cedcoServiceToPrisma = (service: CedcoService) => ({
  id: service.serviceId,
  tenantId: service.tenantId,
  name: service.name,
  category: service.category,
  availableSiteIds: toPrismaJson(service.availableSiteIds),
  requiresEligibilityCheck: service.requiresEligibilityCheck,
  requiresSchedulingIntegration: service.requiresSchedulingIntegration,
  metadata: toPrismaJson(sanitizeMetadata(service.metadata)),
  createdAt: new Date(0),
  updatedAt: new Date(0),
});

export const cedcoServiceFromPrisma = (
  row: ReturnType<typeof cedcoServiceToPrisma>,
): CedcoService => ({
  serviceId: row.id as CedcoService["serviceId"],
  tenantId: row.tenantId,
  name: row.name,
  category: row.category as CedcoService["category"],
  availableSiteIds: toStringArray(row.availableSiteIds) as CedcoService["availableSiteIds"],
  requiresEligibilityCheck: row.requiresEligibilityCheck,
  requiresSchedulingIntegration: row.requiresSchedulingIntegration,
  metadata: toSafeMetadata(row.metadata),
});

export const cedcoAgreementToPrisma = (agreement: CedcoAgreement) => ({
  id: agreement.agreementId,
  tenantId: agreement.tenantId,
  name: agreement.name,
  status: agreement.status,
  applicableServiceIds: toPrismaJson(agreement.applicableServiceIds),
  notesRedacted: agreement.notesRedacted,
  metadata: toPrismaJson(sanitizeMetadata(agreement.metadata)),
  createdAt: new Date(0),
  updatedAt: new Date(0),
});

export const cedcoAgreementFromPrisma = (
  row: ReturnType<typeof cedcoAgreementToPrisma>,
): CedcoAgreement => ({
  agreementId: row.id as CedcoAgreement["agreementId"],
  tenantId: row.tenantId,
  name: row.name,
  status: row.status as CedcoAgreement["status"],
  applicableServiceIds: toStringArray(
    row.applicableServiceIds,
  ) as CedcoAgreement["applicableServiceIds"],
  notesRedacted: row.notesRedacted,
  metadata: toSafeMetadata(row.metadata),
});

export const cedcoD02ConfigurationToPrisma = (configuration: CedcoD02Configuration) => ({
  id: `${configuration.tenantId}-cedco-d02`,
  tenantId: configuration.tenantId,
  defaultLocale: configuration.defaultLocale,
  activeAgentVersionId: configuration.activeAgentVersionId,
  activePromptVersionId: configuration.activePromptVersionId,
  activeFlowVersionId: configuration.activeFlowVersionId,
  activeKnowledgeBaseVersionId: configuration.activeKnowledgeBaseVersionId,
  allowedSiteIds: toPrismaJson(configuration.allowedSiteIds),
  allowedServiceIds: toPrismaJson(configuration.allowedServiceIds),
  handoffEnabled: configuration.handoffEnabled,
  schedulingMode: configuration.schedulingMode,
  eligibilityMode: configuration.eligibilityMode,
  realCallsEnabled: configuration.realCallsEnabled ?? false,
  metadata: toPrismaJson(sanitizeMetadata(configuration.metadata)),
  createdAt: new Date(0),
  updatedAt: new Date(0),
});

export const cedcoD02ConfigurationFromPrisma = (
  row: Partial<ReturnType<typeof cedcoD02ConfigurationToPrisma>> & {
    readonly tenantId: string;
    readonly defaultLocale: string;
    readonly handoffEnabled: boolean;
    readonly schedulingMode: string;
    readonly eligibilityMode: string;
  },
): CedcoD02Configuration => ({
  tenantId: row.tenantId,
  defaultLocale: "es-CO",
  activeAgentVersionId: row.activeAgentVersionId,
  activePromptVersionId: row.activePromptVersionId,
  activeFlowVersionId: row.activeFlowVersionId,
  activeKnowledgeBaseVersionId: row.activeKnowledgeBaseVersionId,
  allowedSiteIds: toStringArray(row.allowedSiteIds) as CedcoD02Configuration["allowedSiteIds"],
  allowedServiceIds: toStringArray(
    row.allowedServiceIds,
  ) as CedcoD02Configuration["allowedServiceIds"],
  handoffEnabled: row.handoffEnabled,
  schedulingMode: row.schedulingMode as CedcoD02Configuration["schedulingMode"],
  eligibilityMode: row.eligibilityMode as CedcoD02Configuration["eligibilityMode"],
  realCallsEnabled: false,
  metadata: toSafeMetadata(row.metadata),
});

export const cedcoD02MetricToPrisma = (metric: CedcoD02Metric) => ({
  id: metric.metricId,
  tenantId: metric.tenantId,
  key: metric.key,
  value: metric.value,
  dimensions: toPrismaJson(sanitizeMetadata(metric.dimensions)),
  occurredAt: metric.occurredAt,
  createdAt: metric.occurredAt,
});

export const cedcoD02MetricFromPrisma = (
  row: ReturnType<typeof cedcoD02MetricToPrisma>,
): CedcoD02Metric => ({
  metricId: row.id,
  tenantId: row.tenantId,
  key: row.key,
  value: row.value,
  dimensions: toSafeMetadata(row.dimensions),
  occurredAt: row.occurredAt,
});
