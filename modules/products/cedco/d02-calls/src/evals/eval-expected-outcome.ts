export interface CedcoD02EvalExpectedOutcome {
  readonly shouldPass: boolean;
  readonly expectedStatus?: string;
  readonly expectedBlockingReasons?: readonly string[];
  readonly expectedHandoffRecommendation?: boolean;
  readonly expectedSafeSummaryContains?: readonly string[];
  readonly forbiddenTerms?: readonly string[];
  readonly forbiddenFields?: readonly string[];
  readonly expectedMetrics?: readonly string[];
  readonly expectedAuditEvents?: readonly string[];
  readonly expectedPolicyDenials?: readonly string[];
  readonly expectedNoProviderEgress?: boolean;
  readonly expectedNoRealCall?: boolean;
  readonly expectedNoPii?: boolean;
}
