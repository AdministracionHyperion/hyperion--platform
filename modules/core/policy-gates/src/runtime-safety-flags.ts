export interface RuntimeSafetyFlags {
  readonly realCallsEnabled: boolean;
  readonly providerEgressEnabled: boolean;
  readonly productionDeployEnabled: boolean;
  readonly rawTranscriptEnabled: boolean;
  readonly rawRecordingEnabled: boolean;
  readonly dataExportEnabled: boolean;
  readonly workerRuntimeEnabled: boolean;
  readonly webhookIngestionEnabled: boolean;
  readonly cedcoD02RealCallsEnabled: boolean;
  readonly cedcoD02SchedulingIntegrationEnabled: boolean;
  readonly cedcoD02EligibilityIntegrationEnabled: boolean;
}

export const defaultRuntimeSafetyFlags: RuntimeSafetyFlags = {
  realCallsEnabled: false,
  providerEgressEnabled: false,
  productionDeployEnabled: false,
  rawTranscriptEnabled: false,
  rawRecordingEnabled: false,
  dataExportEnabled: false,
  workerRuntimeEnabled: false,
  webhookIngestionEnabled: false,
  cedcoD02RealCallsEnabled: false,
  cedcoD02SchedulingIntegrationEnabled: false,
  cedcoD02EligibilityIntegrationEnabled: false,
};
