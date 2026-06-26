import type { AuditEvent } from "../../../../../modules/core/audit/src";
import type { FeatureFlag } from "../../../../../modules/core/feature-flags/src";
import type { FeedbackEvent } from "../../../../../modules/core/feedback/src";
import type { Tenant, TenantSettings } from "../../../../../modules/core/tenancy/src";
import type { VersionedResource } from "../../../../../modules/core/versioning/src";
import { sanitizeMetadata } from "../../../../shared/src/core";
import { toPrismaJson, toSafeMetadata } from "../../prisma/prisma-types";

export function tenantToPrisma(tenant: Tenant, settings?: TenantSettings) {
  return {
    id: tenant.tenantId,
    name: tenant.name,
    status: tenant.status,
    locale: settings?.locale,
    timezone: settings?.timezone,
    dataRetentionDays: settings?.dataRetentionDays,
    piiPolicy: settings ? toPrismaJson({ policy: settings.piiPolicy }) : undefined,
    metadata: toPrismaJson(sanitizeMetadata()),
    createdAt: tenant.createdAt,
    updatedAt: tenant.updatedAt,
  };
}

export function tenantFromPrisma(row: {
  readonly id: string;
  readonly name: string;
  readonly status: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}): Tenant {
  return {
    tenantId: row.id as Tenant["tenantId"],
    name: row.name,
    status: row.status as Tenant["status"],
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function tenantSettingsFromPrisma(row: {
  readonly id: string;
  readonly locale: string | null;
  readonly timezone: string | null;
  readonly dataRetentionDays: number | null;
  readonly piiPolicy: unknown;
}): TenantSettings {
  const piiPolicy =
    row.piiPolicy && typeof row.piiPolicy === "object" && "policy" in row.piiPolicy
      ? String((row.piiPolicy as { readonly policy: unknown }).policy)
      : "standard";

  return {
    tenantId: row.id as TenantSettings["tenantId"],
    locale: row.locale ?? "es-CO",
    timezone: row.timezone ?? "America/Bogota",
    dataRetentionDays: row.dataRetentionDays ?? 365,
    piiPolicy: piiPolicy === "strict" ? "strict" : "standard",
  };
}

export function auditEventToPrisma(event: AuditEvent) {
  return {
    id: event.auditEventId,
    tenantId: event.tenantId,
    actorId: event.actorId,
    correlationId: event.correlationId,
    action: event.action,
    resourceType: event.resourceType,
    resourceId: event.resourceId,
    result: event.result,
    metadata: toPrismaJson(sanitizeMetadata(event.metadata)),
    occurredAt: event.occurredAt,
  };
}

export function auditEventFromPrisma(row: {
  readonly id: string;
  readonly tenantId: string;
  readonly actorId: string | null;
  readonly correlationId: string;
  readonly action: string;
  readonly resourceType: string;
  readonly resourceId: string;
  readonly result: string;
  readonly metadata: unknown;
  readonly occurredAt: Date;
}): AuditEvent {
  return {
    auditEventId: row.id,
    tenantId: row.tenantId,
    actorId: row.actorId ?? "system",
    correlationId: row.correlationId,
    action: row.action as AuditEvent["action"],
    resourceType: row.resourceType as AuditEvent["resourceType"],
    resourceId: row.resourceId,
    result: row.result as AuditEvent["result"],
    metadata: toSafeMetadata(row.metadata),
    occurredAt: row.occurredAt,
  };
}

export function featureFlagToPrisma(flag: FeatureFlag) {
  return {
    id: `${flag.tenantId ?? "global"}-${flag.flagKey}`,
    tenantId: flag.tenantId,
    flagKey: flag.flagKey,
    enabled: flag.enabled,
    description: flag.description,
    createdAt: flag.createdAt,
    updatedAt: flag.createdAt,
  };
}

export function featureFlagFromPrisma(row: {
  readonly tenantId: string | null;
  readonly flagKey: string;
  readonly enabled: boolean;
  readonly description: string | null;
  readonly createdAt: Date;
}): FeatureFlag {
  return {
    tenantId: row.tenantId ?? undefined,
    flagKey: row.flagKey,
    enabled: row.enabled,
    description: row.description ?? "",
    createdAt: row.createdAt,
  };
}

export function versionedResourceToPrisma(version: VersionedResource) {
  return {
    id: version.versionId,
    tenantId: version.tenantId,
    resourceType: version.resourceType,
    resourceId: version.resourceId,
    versionNumber: version.versionNumber,
    status: version.status,
    createdBy: version.createdBy,
    activatedAt: version.activatedAt,
    metadata: toPrismaJson(sanitizeMetadata()),
    createdAt: version.createdAt,
    updatedAt: version.createdAt,
  };
}

export function versionedResourceFromPrisma(row: {
  readonly id: string;
  readonly tenantId: string;
  readonly resourceType: string;
  readonly resourceId: string;
  readonly versionNumber: number;
  readonly status: string;
  readonly createdBy: string;
  readonly createdAt: Date;
  readonly activatedAt: Date | null;
}): VersionedResource {
  return {
    versionId: row.id as VersionedResource["versionId"],
    tenantId: row.tenantId,
    resourceType: row.resourceType,
    resourceId: row.resourceId,
    versionNumber: row.versionNumber,
    status: row.status as VersionedResource["status"],
    createdBy: row.createdBy,
    createdAt: row.createdAt,
    activatedAt: row.activatedAt ?? undefined,
  };
}

export function feedbackEventToPrisma(event: FeedbackEvent) {
  return {
    id: event.feedbackEventId,
    tenantId: event.tenantId,
    actorId: event.actorId,
    correlationId: event.correlationId,
    source: event.source,
    resourceType: event.resourceType,
    resourceId: event.resourceId,
    outcome: event.outcome,
    score: event.score,
    metadata: toPrismaJson(sanitizeMetadata(event.metadata)),
    occurredAt: event.occurredAt,
  };
}

export function feedbackEventFromPrisma(row: {
  readonly id: string;
  readonly tenantId: string;
  readonly actorId: string | null;
  readonly correlationId: string;
  readonly source: string;
  readonly resourceType: string;
  readonly resourceId: string;
  readonly outcome: string;
  readonly score: number | null;
  readonly metadata: unknown;
  readonly occurredAt: Date;
}): FeedbackEvent {
  return {
    feedbackEventId: row.id,
    tenantId: row.tenantId,
    actorId: row.actorId ?? undefined,
    correlationId: row.correlationId,
    source: row.source as FeedbackEvent["source"],
    resourceType: row.resourceType,
    resourceId: row.resourceId,
    outcome: row.outcome as FeedbackEvent["outcome"],
    score: row.score ?? undefined,
    metadata: toSafeMetadata(row.metadata),
    occurredAt: row.occurredAt,
  };
}
