import type { SafeMetadata } from "../../../../../packages/shared/src/core";
import type { CedcoAgreementId } from "./cedco-agreement-id";
import type { CedcoAgreementStatus } from "./cedco-agreement-status";
import type { CedcoServiceId } from "./cedco-service-id";

export interface CedcoAgreement {
  readonly agreementId: CedcoAgreementId;
  readonly tenantId: string;
  readonly name: string;
  readonly status: CedcoAgreementStatus;
  readonly applicableServiceIds: readonly CedcoServiceId[];
  readonly notesRedacted?: string;
  readonly metadata: SafeMetadata;
}
