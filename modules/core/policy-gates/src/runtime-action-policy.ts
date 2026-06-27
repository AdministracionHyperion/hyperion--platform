import type { Permission } from "../../identity-access/src/permission";
import type { PolicyGateAction } from "./policy-gate-action";
import type { PolicyGateReason } from "./policy-gate-reason";
import type { RuntimeSafetyFlags } from "./runtime-safety-flags";

export interface RuntimeActionRequirements {
  readonly requiredFlags: readonly (keyof RuntimeSafetyFlags)[];
  readonly requiredPermissions: readonly Permission[];
  readonly requiredRefs: readonly RuntimeActionRequiredRef[];
  readonly disabledReasonByFlag: Readonly<
    Partial<Record<keyof RuntimeSafetyFlags, PolicyGateReason>>
  >;
}

export type RuntimeActionRequiredRef =
  | "humanApprovalRef"
  | "runbookRef"
  | "providerConfigRef"
  | "secretManagerRef"
  | "explicitApprovedActionRef"
  | "approvalRef";

export function getRuntimeActionRequirements(action: PolicyGateAction): RuntimeActionRequirements {
  switch (action) {
    case "call.dispatch":
    case "call.real_call.enable":
      return {
        requiredFlags: ["realCallsEnabled"],
        requiredPermissions: ["voice:call:dispatch"],
        requiredRefs: ["humanApprovalRef", "runbookRef", "providerConfigRef", "secretManagerRef"],
        disabledReasonByFlag: { realCallsEnabled: "real_calls_disabled" },
      };
    case "cedco.d02.real_calls.enable":
      return {
        requiredFlags: ["realCallsEnabled", "cedcoD02RealCallsEnabled"],
        requiredPermissions: ["voice:call:dispatch"],
        requiredRefs: ["humanApprovalRef", "runbookRef", "providerConfigRef", "secretManagerRef"],
        disabledReasonByFlag: {
          realCallsEnabled: "real_calls_disabled",
          cedcoD02RealCallsEnabled: "cedco_d02_real_calls_disabled",
        },
      };
    case "provider.egress":
      return {
        requiredFlags: ["providerEgressEnabled"],
        requiredPermissions: ["voice:call:dispatch"],
        requiredRefs: ["providerConfigRef", "secretManagerRef", "explicitApprovedActionRef"],
        disabledReasonByFlag: { providerEgressEnabled: "provider_egress_disabled" },
      };
    case "provider.webhook.ingest":
      return {
        requiredFlags: ["webhookIngestionEnabled"],
        requiredPermissions: ["audit:read"],
        requiredRefs: ["secretManagerRef"],
        disabledReasonByFlag: { webhookIngestionEnabled: "webhook_ingestion_disabled" },
      };
    case "production.deploy":
    case "cedco.d02.production.ready":
      return {
        requiredFlags: ["productionDeployEnabled"],
        requiredPermissions: ["platform:tenant:create"],
        requiredRefs: ["approvalRef", "runbookRef"],
        disabledReasonByFlag: { productionDeployEnabled: "production_deploy_disabled" },
      };
    case "runtime.worker.start":
      return {
        requiredFlags: ["workerRuntimeEnabled"],
        requiredPermissions: ["tenant:update"],
        requiredRefs: ["runbookRef"],
        disabledReasonByFlag: { workerRuntimeEnabled: "worker_runtime_disabled" },
      };
    case "raw_transcript.enable":
      return {
        requiredFlags: ["rawTranscriptEnabled"],
        requiredPermissions: ["audit:read"],
        requiredRefs: ["approvalRef", "runbookRef"],
        disabledReasonByFlag: { rawTranscriptEnabled: "raw_transcript_disabled" },
      };
    case "raw_recording.enable":
      return {
        requiredFlags: ["rawRecordingEnabled"],
        requiredPermissions: ["audit:read"],
        requiredRefs: ["approvalRef", "runbookRef"],
        disabledReasonByFlag: { rawRecordingEnabled: "raw_recording_disabled" },
      };
    case "data.export":
      return {
        requiredFlags: ["dataExportEnabled"],
        requiredPermissions: ["audit:read"],
        requiredRefs: ["approvalRef", "runbookRef"],
        disabledReasonByFlag: { dataExportEnabled: "data_export_disabled" },
      };
    case "cedco.d02.scheduling.integration.enable":
      return {
        requiredFlags: ["cedcoD02SchedulingIntegrationEnabled"],
        requiredPermissions: ["tenant:update"],
        requiredRefs: ["approvalRef", "runbookRef"],
        disabledReasonByFlag: {
          cedcoD02SchedulingIntegrationEnabled: "scheduling_integration_disabled",
        },
      };
    case "cedco.d02.eligibility.integration.enable":
      return {
        requiredFlags: ["cedcoD02EligibilityIntegrationEnabled"],
        requiredPermissions: ["tenant:update"],
        requiredRefs: ["approvalRef", "runbookRef"],
        disabledReasonByFlag: {
          cedcoD02EligibilityIntegrationEnabled: "eligibility_integration_disabled",
        },
      };
  }
}
