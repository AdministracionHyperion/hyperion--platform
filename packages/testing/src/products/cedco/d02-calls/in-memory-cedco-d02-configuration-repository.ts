import type {
  CedcoD02Configuration,
  CedcoD02ConfigurationRepositoryPort,
} from "../../../../../../modules/products/cedco/d02-calls/src";

export class InMemoryCedcoD02ConfigurationRepository implements CedcoD02ConfigurationRepositoryPort {
  private readonly configurations = new Map<string, CedcoD02Configuration>();

  async save(configuration: CedcoD02Configuration): Promise<void> {
    this.configurations.set(configuration.tenantId, configuration);
  }

  async findByTenant(tenantId: string): Promise<CedcoD02Configuration | null> {
    return this.configurations.get(tenantId) ?? null;
  }
}
