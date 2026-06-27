import type { SafeMetadata } from "../../../../packages/shared/src/core";

export interface CallRuntimeCommand {
  readonly tenantId: string;
  readonly actorId: string;
  readonly correlationId: string;
  readonly callIntentId: string;
  readonly productCode: "cedco-d02";
  readonly runtimeMode: "mock";
  readonly scriptId: string;
  readonly safeContactRef: string;
  readonly patientContextRef: string;
  readonly consentRef: string;
  readonly metadata: SafeMetadata;
}
