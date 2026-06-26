export interface OrchestrationPolicy {
  readonly allowRuntimeExecution: false;
  readonly allowProviderCalls: false;
  readonly allowCedcoSpecificLogic: false;
}

export const defaultOrchestrationPolicy: OrchestrationPolicy = {
  allowRuntimeExecution: false,
  allowProviderCalls: false,
  allowCedcoSpecificLogic: false,
};
