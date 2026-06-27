import type { AuditLogPort } from "../../../../../modules/core/audit/src";
import type { FeatureFlagRepositoryPort } from "../../../../../modules/core/feature-flags/src";
import type { FeedbackRepositoryPort } from "../../../../../modules/core/feedback/src";
import type { TenantRepositoryPort } from "../../../../../modules/core/tenancy/src";
import type { VersionRepositoryPort } from "../../../../../modules/core/versioning/src";
import type { HyperionPrismaClient } from "../../prisma/prisma-types";
import {
  auditEventFromPrisma,
  auditEventToPrisma,
  featureFlagFromPrisma,
  featureFlagToPrisma,
  feedbackEventFromPrisma,
  feedbackEventToPrisma,
  tenantFromPrisma,
  tenantSettingsFromPrisma,
  tenantToPrisma,
  versionedResourceFromPrisma,
  versionedResourceToPrisma,
} from "../../mappers/core";

export class PrismaTenantRepository implements TenantRepositoryPort {
  constructor(private readonly prisma: HyperionPrismaClient) {}

  async save(
    ...args: Parameters<TenantRepositoryPort["save"]>
  ): ReturnType<TenantRepositoryPort["save"]> {
    const [tenant, settings] = args;
    const data = tenantToPrisma(tenant, settings);
    await this.prisma.tenant.upsert({
      where: { id: data.id },
      create: data,
      update: data,
    });
  }

  async findById(
    ...args: Parameters<TenantRepositoryPort["findById"]>
  ): ReturnType<TenantRepositoryPort["findById"]> {
    const [tenantId] = args;
    const row = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    return row ? tenantFromPrisma(row) : null;
  }

  async findSettings(
    ...args: Parameters<TenantRepositoryPort["findSettings"]>
  ): ReturnType<TenantRepositoryPort["findSettings"]> {
    const [tenantId] = args;
    const row = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    return row ? tenantSettingsFromPrisma(row) : null;
  }
}

export class PrismaAuditLogRepository implements AuditLogPort {
  constructor(private readonly prisma: HyperionPrismaClient) {}

  async append(...args: Parameters<AuditLogPort["append"]>): ReturnType<AuditLogPort["append"]> {
    await this.prisma.auditLog.create({ data: auditEventToPrisma(args[0]) });
  }

  async findByTenant(
    ...args: Parameters<AuditLogPort["findByTenant"]>
  ): ReturnType<AuditLogPort["findByTenant"]> {
    const rows = await this.prisma.auditLog.findMany({
      where: { tenantId: args[0] },
      orderBy: { occurredAt: "asc" },
    });
    return rows.map(auditEventFromPrisma);
  }
}

export class PrismaFeatureFlagRepository implements FeatureFlagRepositoryPort {
  constructor(private readonly prisma: HyperionPrismaClient) {}

  async save(
    ...args: Parameters<FeatureFlagRepositoryPort["save"]>
  ): ReturnType<FeatureFlagRepositoryPort["save"]> {
    const data = featureFlagToPrisma(args[0]);
    await this.prisma.featureFlag.upsert({
      where: { id: data.id },
      create: data,
      update: data,
    });
  }

  async findByKey(
    ...args: Parameters<FeatureFlagRepositoryPort["findByKey"]>
  ): ReturnType<FeatureFlagRepositoryPort["findByKey"]> {
    const [flagKey, tenantId] = args;
    const row = await this.prisma.featureFlag.findFirst({ where: { flagKey, tenantId } });
    return row ? featureFlagFromPrisma(row) : null;
  }
}

export class PrismaVersionRepository implements VersionRepositoryPort {
  constructor(private readonly prisma: HyperionPrismaClient) {}

  async save(
    ...args: Parameters<VersionRepositoryPort["save"]>
  ): ReturnType<VersionRepositoryPort["save"]> {
    const data = versionedResourceToPrisma(args[0]);
    await this.prisma.versionedResource.upsert({
      where: { id: data.id },
      create: data,
      update: data,
    });
  }

  async findById(
    ...args: Parameters<VersionRepositoryPort["findById"]>
  ): ReturnType<VersionRepositoryPort["findById"]> {
    const row = await this.prisma.versionedResource.findUnique({ where: { id: args[0] } });
    return row ? versionedResourceFromPrisma(row) : null;
  }

  async findByResource(
    ...args: Parameters<VersionRepositoryPort["findByResource"]>
  ): ReturnType<VersionRepositoryPort["findByResource"]> {
    const [tenantId, resourceType, resourceId] = args;
    const rows = await this.prisma.versionedResource.findMany({
      where: { tenantId, resourceType, resourceId },
      orderBy: { versionNumber: "asc" },
    });
    return rows.map(versionedResourceFromPrisma);
  }
}

export class PrismaFeedbackRepository implements FeedbackRepositoryPort {
  constructor(private readonly prisma: HyperionPrismaClient) {}

  async save(
    ...args: Parameters<FeedbackRepositoryPort["save"]>
  ): ReturnType<FeedbackRepositoryPort["save"]> {
    await this.prisma.feedbackEvent.create({ data: feedbackEventToPrisma(args[0]) });
  }

  async findByTenant(
    ...args: Parameters<FeedbackRepositoryPort["findByTenant"]>
  ): ReturnType<FeedbackRepositoryPort["findByTenant"]> {
    const rows = await this.prisma.feedbackEvent.findMany({
      where: { tenantId: args[0] },
      orderBy: { occurredAt: "asc" },
    });
    return rows.map(feedbackEventFromPrisma);
  }
}
