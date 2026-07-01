import type { OperationalDashboardReadModel } from "../../../../../../core/operations-dashboard/src";

export interface CedcoD02OperationalReport {
  readonly tenantId: string;
  readonly correlationId: string;
  readonly generatedAt: string;
  readonly reportStatus:
    | "ready_for_staging_demo"
    | "ready_no_activity"
    | "needs_review"
    | "blocked";
  readonly scope: {
    readonly runtimeMode: "staging_safe_mock_only";
    readonly realCallsEnabled: false;
    readonly continuousCallsEnabled: false;
    readonly providerEgressEnabled: false;
    readonly pbxRuntimeConnected: false;
    readonly inventoryVerticalIncluded: false;
  };
  readonly kpis: {
    readonly mockCallFlowsTotal: number;
    readonly mockCallFlowsCompleted: number;
    readonly providerEventsTotal: number;
    readonly providerEventsProcessed: number;
    readonly providerEventReplaysBlocked: number;
    readonly handoffRecommendedTotal: number;
    readonly policyGateDenials: number;
    readonly evalGrade: string;
    readonly evalScore: number;
    readonly criticalEvalFailures: number;
    readonly auditEventsPreviewed: number;
    readonly metricsSnapshotTotal: number;
  };
  readonly sections: {
    readonly callSessions: CedcoD02ReportSection;
    readonly providerEvents: CedcoD02ReportSection;
    readonly postCall: CedcoD02ReportSection;
    readonly audit: CedcoD02ReportSection;
    readonly metrics: CedcoD02ReportSection;
    readonly compliance: CedcoD02ReportSection;
  };
  readonly complianceMatrix: readonly CedcoD02ComplianceControl[];
  readonly blockers: readonly CedcoD02ReportBlocker[];
}

export interface CedcoD02ReportSection {
  readonly status: "complete" | "empty" | "needs_review" | "blocked";
  readonly summary: string;
  readonly evidenceCount: number;
}

export interface CedcoD02ReportBlocker {
  readonly code: string;
  readonly label: string;
  readonly severity: "low" | "medium" | "high";
}

export interface CedcoD02ComplianceControl {
  readonly key: string;
  readonly status: "enforced" | "staging_enforced" | "blocked_by_policy" | "excluded";
  readonly evidence: string;
}

export function buildCedcoD02OperationalReport(
  model: OperationalDashboardReadModel,
): CedcoD02OperationalReport {
  const mockCallFlowsCompleted = model.mockCallFlows.filter(
    (flow) => flow.status === "completed",
  ).length;
  const providerEventsProcessed = model.providerEvents.filter((event) => event.processed).length;
  const providerEventReplaysBlocked = model.providerEvents.filter(
    (event) => event.replayBlocked,
  ).length;
  const handoffRecommendedTotal = model.mockCallFlows.filter(
    (flow) => flow.handoffRecommended,
  ).length;
  const blockers = buildReportBlockers({
    mockCallFlowsTotal: model.mockCallFlows.length,
    providerEventsTotal: model.providerEvents.length,
    criticalEvalFailures: model.evalSummary.criticalFailed,
    policyGateDenials: model.policyGateSummary.deniedTotal,
  });

  return {
    tenantId: model.tenantId,
    correlationId: model.correlationId,
    generatedAt: model.generatedAt,
    reportStatus: resolveReportStatus({
      mockCallFlowsTotal: model.mockCallFlows.length,
      criticalEvalFailures: model.evalSummary.criticalFailed,
      policyGateDenials: model.policyGateSummary.deniedTotal,
    }),
    scope: {
      runtimeMode: "staging_safe_mock_only",
      realCallsEnabled: false,
      continuousCallsEnabled: false,
      providerEgressEnabled: false,
      pbxRuntimeConnected: false,
      inventoryVerticalIncluded: false,
    },
    kpis: {
      mockCallFlowsTotal: model.mockCallFlows.length,
      mockCallFlowsCompleted,
      providerEventsTotal: model.providerEvents.length,
      providerEventsProcessed,
      providerEventReplaysBlocked,
      handoffRecommendedTotal,
      policyGateDenials: model.policyGateSummary.deniedTotal,
      evalGrade: model.evalSummary.grade,
      evalScore: model.evalSummary.weightedPercentage,
      criticalEvalFailures: model.evalSummary.criticalFailed,
      auditEventsPreviewed: model.auditPreview.length,
      metricsSnapshotTotal: model.metricsSnapshot.length,
    },
    sections: {
      callSessions: {
        status: model.mockCallFlows.length > 0 ? "complete" : "empty",
        summary: "Sanitized mock call sessions available for queue and attempt review.",
        evidenceCount: model.mockCallFlows.length,
      },
      providerEvents: {
        status: model.providerEvents.length > 0 ? "complete" : "empty",
        summary: "Mock provider events are normalized, replay-aware and provider-egress free.",
        evidenceCount: model.providerEvents.length,
      },
      postCall: {
        status: mockCallFlowsCompleted > 0 || providerEventsProcessed > 0 ? "complete" : "empty",
        summary:
          "Post-call outcome is derived from sanitized mock flow and provider event evidence.",
        evidenceCount: mockCallFlowsCompleted + providerEventsProcessed,
      },
      audit: {
        status: model.auditPreview.length > 0 ? "complete" : "empty",
        summary: "Audit preview exposes sanitized actions and correlation references only.",
        evidenceCount: model.auditPreview.length,
      },
      metrics: {
        status: model.metricsSnapshot.length > 0 ? "complete" : "empty",
        summary: "Metrics snapshot aggregates safe counters and CEDCO D02 mock-flow measurements.",
        evidenceCount: model.metricsSnapshot.length,
      },
      compliance: {
        status:
          model.evalSummary.criticalFailed > 0 || model.policyGateSummary.deniedTotal > 0
            ? "needs_review"
            : "complete",
        summary: "Compliance is based on deterministic D02 evals and policy gate denials.",
        evidenceCount: model.evalSummary.totalCases,
      },
    },
    complianceMatrix: buildComplianceMatrix(model),
    blockers,
  };
}

function resolveReportStatus(input: {
  readonly mockCallFlowsTotal: number;
  readonly criticalEvalFailures: number;
  readonly policyGateDenials: number;
}): CedcoD02OperationalReport["reportStatus"] {
  if (input.criticalEvalFailures > 0) return "blocked";
  if (input.policyGateDenials > 0) return "needs_review";
  if (input.mockCallFlowsTotal === 0) return "ready_no_activity";
  return "ready_for_staging_demo";
}

function buildReportBlockers(input: {
  readonly mockCallFlowsTotal: number;
  readonly providerEventsTotal: number;
  readonly criticalEvalFailures: number;
  readonly policyGateDenials: number;
}): CedcoD02ReportBlocker[] {
  const blockers: CedcoD02ReportBlocker[] = [];
  if (input.mockCallFlowsTotal === 0) {
    blockers.push({
      code: "staging_mock_sessions_missing",
      label: "No sanitized mock call session evidence exists for this tenant yet.",
      severity: "medium",
    });
  }
  if (input.providerEventsTotal === 0) {
    blockers.push({
      code: "staging_provider_events_missing",
      label: "No sanitized mock provider event evidence exists for this tenant yet.",
      severity: "medium",
    });
  }
  if (input.policyGateDenials > 0) {
    blockers.push({
      code: "policy_denials_present",
      label: "Policy gate denials need operator review before demo signoff.",
      severity: "medium",
    });
  }
  if (input.criticalEvalFailures > 0) {
    blockers.push({
      code: "critical_eval_failures_present",
      label: "Critical D02 eval failures block operational signoff.",
      severity: "high",
    });
  }
  return blockers;
}

function buildComplianceMatrix(
  model: OperationalDashboardReadModel,
): readonly CedcoD02ComplianceControl[] {
  return [
    {
      key: "auth_staging_boundary",
      status: "staging_enforced",
      evidence: "Protected routes require tenant-scoped actor context or local-staging/JWT auth.",
    },
    {
      key: "consent_required",
      status: "enforced",
      evidence: "D02 dry-run requires consent.granted=true and consent_ref before dispatch.",
    },
    {
      key: "eligibility_contactability",
      status: "staging_enforced",
      evidence:
        "Eligibility API records mock or integration_required checks without real rights lookup.",
    },
    {
      key: "safe_intent",
      status: model.evalSummary.criticalFailed > 0 ? "blocked_by_policy" : "enforced",
      evidence: `Deterministic D02 eval suite grade ${model.evalSummary.grade}.`,
    },
    {
      key: "no_clinical_triage",
      status: "enforced",
      evidence: "Compliance policy blocks diagnosis and clinical triage intents.",
    },
    {
      key: "human_handoff",
      status: "staging_enforced",
      evidence: "Handoff is recommended by policy and stored as safe refs only.",
    },
    {
      key: "provider_egress",
      status: "blocked_by_policy",
      evidence: "Provider egress remains disabled in runtime safety and policy gates.",
    },
    {
      key: "real_calls",
      status: "blocked_by_policy",
      evidence: "Real call dispatch remains disabled; only mock flows are reported.",
    },
    {
      key: "pbx_runtime",
      status: "excluded",
      evidence: "PBX runtime is outside this D02/R02 closure.",
    },
    {
      key: "inventory_vertical",
      status: "excluded",
      evidence: "CEDCO inventory vertical is outside this closure.",
    },
    {
      key: "raw_media_and_text",
      status: "blocked_by_policy",
      evidence: "Raw text, recordings and broad data export remain disabled.",
    },
    {
      key: "operational_reporting",
      status: "staging_enforced",
      evidence: "Dashboard and operational report are generated from sanitized read models.",
    },
  ];
}
