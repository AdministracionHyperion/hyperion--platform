export const cedcoD02MockFlowFixture = {
  cedcoSiteId: "bucaramanga",
  serviceId: "odontologia-general-test",
  agreementId: "convenio-test",
  safeContactRef: "safe-contact-ref-001",
  patientContextRef: "cedco-context-ref-001",
  consentRef: "cedco-consent-ref-001",
  callPurpose: "orientation",
  objective: "orientation",
  scriptId: "cedco-d02-default-mock",
  metadata: {
    source: "synthetic-test",
  },
} as const;

export const cedcoD02MockHeaders = {
  "x-actor-id": "actor-test",
  "x-actor-roles": "tenant-admin",
  "x-correlation-id": "corr-cedco-mock-api-001",
} as const;
