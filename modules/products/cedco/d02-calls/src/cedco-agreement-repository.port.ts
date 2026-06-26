import type { CedcoAgreement } from "./cedco-agreement";
import type { CedcoAgreementId } from "./cedco-agreement-id";

export interface CedcoAgreementRepositoryPort {
  save(agreement: CedcoAgreement): Promise<void>;
  findById(tenantId: string, agreementId: CedcoAgreementId): Promise<CedcoAgreement | null>;
  findByTenant(tenantId: string): Promise<readonly CedcoAgreement[]>;
}
