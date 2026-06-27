import type { CedcoService } from "./cedco-service";
import type { CedcoServiceId } from "./cedco-service-id";

export interface CedcoServiceRepositoryPort {
  save(service: CedcoService): Promise<void>;
  findById(tenantId: string, serviceId: CedcoServiceId): Promise<CedcoService | null>;
  findByTenant(tenantId: string): Promise<readonly CedcoService[]>;
}
