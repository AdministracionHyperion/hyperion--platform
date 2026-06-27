export const dialerBlockedReasons = [
  "missing_external_request_id",
  "missing_tenant_id",
  "missing_correlation_id",
  "missing_consent",
  "missing_consent_ref",
  "unsafe_payload",
  "external_callback_url_blocked",
  "runtime_mode_not_dry_run",
  "real_calls_disabled",
  "provider_egress_disabled",
  "missing_approval_ref",
  "missing_runbook_ref",
  "missing_provider_config_ref",
  "missing_secret_manager_ref",
  "dialer_p0_hardening_incomplete",
] as const;

export type DialerBlockedReason = (typeof dialerBlockedReasons)[number];
