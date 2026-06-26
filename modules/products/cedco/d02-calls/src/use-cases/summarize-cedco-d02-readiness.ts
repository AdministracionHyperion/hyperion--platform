import type { CedcoD02CallReadiness } from "../cedco-d02-call-readiness";

export interface CedcoD02ReadinessSummary {
  readonly tenantId: string;
  readonly productionReady: false;
  readonly blockingReasons: readonly string[];
  readonly gaps: readonly string[];
  readonly nextStep: string;
}

export function summarizeCedcoD02Readiness(input: {
  readonly readiness: CedcoD02CallReadiness;
  readonly evalsApproved?: boolean;
  readonly smokeApproved?: boolean;
  readonly providerConfigured?: boolean;
  readonly runbookApproved?: boolean;
  readonly humanApproval?: boolean;
}): CedcoD02ReadinessSummary {
  const gaps = [
    !input.evalsApproved ? "evals_not_approved" : null,
    !input.smokeApproved ? "smoke_not_approved" : null,
    !input.providerConfigured ? "provider_not_configured" : null,
    !input.runbookApproved ? "runbook_not_approved" : null,
    !input.humanApproval ? "human_approval_missing" : null,
  ].filter((gap): gap is string => Boolean(gap));

  return {
    tenantId: input.readiness.tenantId,
    productionReady: false,
    blockingReasons: input.readiness.blockingReasons,
    gaps,
    nextStep:
      input.readiness.blockingReasons.length > 0 || gaps.length > 0
        ? "continue_domain_and_integration_preparation"
        : "still_requires_future_runtime_governance_before_real_calls",
  };
}
