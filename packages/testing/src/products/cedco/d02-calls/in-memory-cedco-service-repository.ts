import type {
  CedcoService,
  CedcoServiceId,
  CedcoServiceRepositoryPort,
} from "../../../../../../modules/products/cedco/d02-calls/src";

export class InMemoryCedcoServiceRepository implements CedcoServiceRepositoryPort {
  private readonly services = new Map<string, CedcoService>();

  async save(service: CedcoService): Promise<void> {
    this.services.set(key(service.tenantId, service.serviceId), service);
  }

  async findById(tenantId: string, serviceId: CedcoServiceId): Promise<CedcoService | null> {
    return this.services.get(key(tenantId, serviceId)) ?? null;
  }

  async findByTenant(tenantId: string): Promise<readonly CedcoService[]> {
    return [...this.services.values()].filter((service) => service.tenantId === tenantId);
  }
}

function key(tenantId: string, id: string): string {
  return `${tenantId}:${id}`;
}
