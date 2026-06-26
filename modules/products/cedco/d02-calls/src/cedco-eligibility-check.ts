import type { SafeMetadata } from "../../../../../packages/shared/src/core";
import type { CedcoAgreementId } from "./cedco-agreement-id";
import type { CedcoPatientContextRef } from "./cedco-patient-context-ref";
import type { CedcoServiceId } from "./cedco-service-id";

export type CedcoEligibilityMode = "mock" | "integration_required";
export type CedcoEligibilityStatus =
  | "pending"
  | "eligible"
  | "ineligible"
  | "unknown"
  | "integration_required";

export interface CedcoEligibilityCheck {
  readonly eligibilityCheckId: string;
  readonly tenantId: string;
  readonly patientContextRef: CedcoPatientContextRef;
  readonly agreementId?: CedcoAgreementId;
  readonly serviceId?: CedcoServiceId;
  readonly status: CedcoEligibilityStatus;
  readonly mode: CedcoEligibilityMode;
  readonly metadata: SafeMetadata;
}
