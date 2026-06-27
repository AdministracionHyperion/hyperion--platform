import type { SafeMetadata } from "../../../../../packages/shared/src/core";
import type { CallId } from "../../../../voice/voice-core/src";
import type { CedcoPatientContextRef } from "./cedco-patient-context-ref";
import type { CedcoServiceId } from "./cedco-service-id";
import type { CedcoSiteId } from "./cedco-site-id";

export type CedcoSchedulingMode = "mock" | "integration_required";
export type CedcoSchedulingStatus =
  | "requested"
  | "oriented"
  | "mock_confirmed"
  | "integration_required"
  | "blocked";

export interface CedcoSchedulingRequest {
  readonly schedulingRequestId: string;
  readonly tenantId: string;
  readonly callId?: CallId;
  readonly patientContextRef: CedcoPatientContextRef;
  readonly serviceId: CedcoServiceId;
  readonly siteId?: CedcoSiteId;
  readonly status: CedcoSchedulingStatus;
  readonly mode: CedcoSchedulingMode;
  readonly metadata: SafeMetadata;
}
