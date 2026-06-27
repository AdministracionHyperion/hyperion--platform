export const policyGateReasons = [
  "real_calls_disabled",
  "provider_egress_disabled",
  "production_deploy_disabled",
  "raw_transcript_disabled",
  "raw_recording_disabled",
  "data_export_disabled",
  "worker_runtime_disabled",
  "webhook_ingestion_disabled",
  "missing_permission",
  "missing_runbook",
  "missing_human_approval",
  "missing_secret_manager",
  "missing_provider_configuration",
  "cedco_d02_real_calls_disabled",
  "scheduling_integration_disabled",
  "eligibility_integration_disabled",
] as const;

export type PolicyGateReason = (typeof policyGateReasons)[number];
