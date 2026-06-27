import type { CedcoD02Configuration } from "./cedco-d02-configuration";

export interface CedcoD02ConfigurationRepositoryPort {
  save(configuration: CedcoD02Configuration): Promise<void>;
  findByTenant(tenantId: string): Promise<CedcoD02Configuration | null>;
}
