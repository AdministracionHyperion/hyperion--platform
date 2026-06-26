import type {
  CedcoAgreementRepositoryPort,
  CedcoD02ConfigurationRepositoryPort,
  CedcoD02MetricsPort,
  CedcoServiceRepositoryPort,
  CedcoSiteRepositoryPort,
} from "../../../../../../../modules/products/cedco/d02-calls/src";
import {
  cedcoAgreementFromPrisma,
  cedcoAgreementToPrisma,
  cedcoD02ConfigurationFromPrisma,
  cedcoD02ConfigurationToPrisma,
  cedcoD02MetricFromPrisma,
  cedcoD02MetricToPrisma,
  cedcoServiceFromPrisma,
  cedcoServiceToPrisma,
  cedcoSiteFromPrisma,
  cedcoSiteToPrisma,
} from "../../../../mappers/products/cedco/d02-calls";
import {
  fromPersistedRow,
  fromPersistedRows,
  type HyperionPrismaClient,
} from "../../../../prisma/prisma-types";

export class PrismaCedcoSiteRepository implements CedcoSiteRepositoryPort {
  constructor(private readonly prisma: HyperionPrismaClient) {}

  async save(
    ...args: Parameters<CedcoSiteRepositoryPort["save"]>
  ): ReturnType<CedcoSiteRepositoryPort["save"]> {
    const data = cedcoSiteToPrisma(args[0]);
    await this.prisma.cedcoSite.upsert({ where: { id: data.id }, create: data, update: data });
  }

  async findById(
    ...args: Parameters<CedcoSiteRepositoryPort["findById"]>
  ): ReturnType<CedcoSiteRepositoryPort["findById"]> {
    const [tenantId, siteId] = args;
    const row = await this.prisma.cedcoSite.findFirst({ where: { tenantId, id: siteId } });
    return row ? fromPersistedRow(cedcoSiteFromPrisma, row) : null;
  }

  async findByTenant(
    ...args: Parameters<CedcoSiteRepositoryPort["findByTenant"]>
  ): ReturnType<CedcoSiteRepositoryPort["findByTenant"]> {
    const rows = await this.prisma.cedcoSite.findMany({ where: { tenantId: args[0] } });
    return fromPersistedRows(cedcoSiteFromPrisma, rows);
  }
}

export class PrismaCedcoServiceRepository implements CedcoServiceRepositoryPort {
  constructor(private readonly prisma: HyperionPrismaClient) {}

  async save(
    ...args: Parameters<CedcoServiceRepositoryPort["save"]>
  ): ReturnType<CedcoServiceRepositoryPort["save"]> {
    const data = cedcoServiceToPrisma(args[0]);
    await this.prisma.cedcoService.upsert({ where: { id: data.id }, create: data, update: data });
  }

  async findById(
    ...args: Parameters<CedcoServiceRepositoryPort["findById"]>
  ): ReturnType<CedcoServiceRepositoryPort["findById"]> {
    const [tenantId, serviceId] = args;
    const row = await this.prisma.cedcoService.findFirst({ where: { tenantId, id: serviceId } });
    return row ? fromPersistedRow(cedcoServiceFromPrisma, row) : null;
  }

  async findByTenant(
    ...args: Parameters<CedcoServiceRepositoryPort["findByTenant"]>
  ): ReturnType<CedcoServiceRepositoryPort["findByTenant"]> {
    const rows = await this.prisma.cedcoService.findMany({ where: { tenantId: args[0] } });
    return fromPersistedRows(cedcoServiceFromPrisma, rows);
  }
}

export class PrismaCedcoAgreementRepository implements CedcoAgreementRepositoryPort {
  constructor(private readonly prisma: HyperionPrismaClient) {}

  async save(
    ...args: Parameters<CedcoAgreementRepositoryPort["save"]>
  ): ReturnType<CedcoAgreementRepositoryPort["save"]> {
    const data = cedcoAgreementToPrisma(args[0]);
    await this.prisma.cedcoAgreement.upsert({ where: { id: data.id }, create: data, update: data });
  }

  async findById(
    ...args: Parameters<CedcoAgreementRepositoryPort["findById"]>
  ): ReturnType<CedcoAgreementRepositoryPort["findById"]> {
    const [tenantId, agreementId] = args;
    const row = await this.prisma.cedcoAgreement.findFirst({
      where: { tenantId, id: agreementId },
    });
    return row ? fromPersistedRow(cedcoAgreementFromPrisma, row) : null;
  }

  async findByTenant(
    ...args: Parameters<CedcoAgreementRepositoryPort["findByTenant"]>
  ): ReturnType<CedcoAgreementRepositoryPort["findByTenant"]> {
    const rows = await this.prisma.cedcoAgreement.findMany({ where: { tenantId: args[0] } });
    return fromPersistedRows(cedcoAgreementFromPrisma, rows);
  }
}

export class PrismaCedcoD02ConfigurationRepository implements CedcoD02ConfigurationRepositoryPort {
  constructor(private readonly prisma: HyperionPrismaClient) {}

  async save(
    ...args: Parameters<CedcoD02ConfigurationRepositoryPort["save"]>
  ): ReturnType<CedcoD02ConfigurationRepositoryPort["save"]> {
    const data = cedcoD02ConfigurationToPrisma(args[0]);
    await this.prisma.cedcoD02Configuration.upsert({
      where: { id: data.id },
      create: data,
      update: data,
    });
  }

  async findByTenant(
    ...args: Parameters<CedcoD02ConfigurationRepositoryPort["findByTenant"]>
  ): ReturnType<CedcoD02ConfigurationRepositoryPort["findByTenant"]> {
    const row = await this.prisma.cedcoD02Configuration.findUnique({
      where: { tenantId: args[0] },
    });
    return row ? fromPersistedRow(cedcoD02ConfigurationFromPrisma, row) : null;
  }
}

export class PrismaCedcoD02MetricsRepository implements CedcoD02MetricsPort {
  constructor(private readonly prisma: HyperionPrismaClient) {}

  async record(
    ...args: Parameters<CedcoD02MetricsPort["record"]>
  ): ReturnType<CedcoD02MetricsPort["record"]> {
    await this.prisma.cedcoD02Metric.create({ data: cedcoD02MetricToPrisma(args[0]) });
  }

  async summarizeByTenant(
    ...args: Parameters<CedcoD02MetricsPort["summarizeByTenant"]>
  ): ReturnType<CedcoD02MetricsPort["summarizeByTenant"]> {
    const rows = await this.prisma.cedcoD02Metric.findMany({
      where: { tenantId: args[0] },
      orderBy: { occurredAt: "asc" },
    });
    return fromPersistedRows(cedcoD02MetricFromPrisma, rows);
  }
}
