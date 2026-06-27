import type {
  CedcoAgreement,
  CedcoAgreementId,
  CedcoAgreementRepositoryPort,
} from "../../../../../../modules/products/cedco/d02-calls/src";

export class InMemoryCedcoAgreementRepository implements CedcoAgreementRepositoryPort {
  private readonly agreements = new Map<string, CedcoAgreement>();

  async save(agreement: CedcoAgreement): Promise<void> {
    this.agreements.set(key(agreement.tenantId, agreement.agreementId), agreement);
  }

  async findById(tenantId: string, agreementId: CedcoAgreementId): Promise<CedcoAgreement | null> {
    return this.agreements.get(key(tenantId, agreementId)) ?? null;
  }

  async findByTenant(tenantId: string): Promise<readonly CedcoAgreement[]> {
    return [...this.agreements.values()].filter((agreement) => agreement.tenantId === tenantId);
  }
}

function key(tenantId: string, id: string): string {
  return `${tenantId}:${id}`;
}
