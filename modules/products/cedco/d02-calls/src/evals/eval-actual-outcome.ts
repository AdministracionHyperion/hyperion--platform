export interface CedcoD02EvalActualOutcome {
  readonly passed: boolean;
  readonly status?: string;
  readonly blockingReasons?: readonly string[];
  readonly handoffRecommended?: boolean;
  readonly safeSummary?: string;
  readonly returnedFields?: readonly string[];
  readonly metrics?: readonly string[];
  readonly auditEvents?: readonly string[];
  readonly policyDenials?: readonly string[];
  readonly providerEgressDetected?: boolean;
  readonly realCallDetected?: boolean;
  readonly piiDetected?: boolean;
  readonly errors?: readonly string[];
  readonly metadata?: Readonly<Record<string, unknown>>;
}
