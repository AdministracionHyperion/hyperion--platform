export interface DashboardRuntimeSafety {
  readonly realCallsEnabled: false;
  readonly providerEgressEnabled: false;
  readonly productionDeployEnabled: false;
  readonly rawTextEnabled: false;
  readonly rawRecordingEnabled: false;
  readonly dataExportEnabled: false;
  readonly workerRuntimeEnabled: "safe_jobs_only";
  readonly explanation: string;
}

export function defaultDashboardRuntimeSafety(): DashboardRuntimeSafety {
  return {
    realCallsEnabled: false,
    providerEgressEnabled: false,
    productionDeployEnabled: false,
    rawTextEnabled: false,
    rawRecordingEnabled: false,
    dataExportEnabled: false,
    workerRuntimeEnabled: "safe_jobs_only",
    explanation:
      "Mock-only operational dashboard. Dangerous runtime actions remain blocked by policy gates.",
  };
}
