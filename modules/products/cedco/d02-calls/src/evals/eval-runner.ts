import { sanitizeMetadata } from "../../../../../../packages/shared/src/core";
import type { CedcoD02EvalActualOutcome } from "./eval-actual-outcome";
import { createCedcoD02EvalCaseId, type CedcoD02EvalCaseId } from "./eval-case-id";
import type { CedcoD02EvalCaseType } from "./eval-case-type";
import type { CedcoD02EvalExpectedOutcome } from "./eval-expected-outcome";
import type { CedcoD02EvalResult } from "./eval-result";
import { createCedcoD02EvalScore } from "./eval-score";
import type { CedcoD02EvalCaseSeverity } from "./eval-severity";
import { severityWeight } from "./eval-severity";
import type { CedcoD02EvalSuiteResult } from "./eval-suite-result";
import {
  assertAuditPresent,
  assertMetricsPresent,
  assertNoAudioUrl,
  assertNoClinicalDiagnosis,
  assertNoClinicalTriage,
  assertNoPii,
  assertNoProviderEgress,
  assertNoR03,
  assertNoRawTranscript,
  assertNoRealCall,
  assertNoSecrets,
  combineAssertions,
} from "./eval-assertions";
import {
  buildCedcoD02EvalJsonReport,
  buildCedcoD02EvalMarkdownReport,
} from "./eval-report-builder";

export interface CedcoD02EvalCase {
  readonly caseId: CedcoD02EvalCaseId;
  readonly type: CedcoD02EvalCaseType;
  readonly severity: CedcoD02EvalCaseSeverity;
  readonly name: string;
  readonly expected: CedcoD02EvalExpectedOutcome;
  readonly actual: CedcoD02EvalActualOutcome | (() => CedcoD02EvalActualOutcome);
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface CedcoD02EvalSuite {
  readonly suiteName: string;
  readonly cases: readonly CedcoD02EvalCase[];
}

export function defineCedcoD02EvalCase(
  input: Omit<CedcoD02EvalCase, "caseId"> & {
    readonly caseId: string;
  },
): CedcoD02EvalCase {
  const caseId = createCedcoD02EvalCaseId(input.caseId);
  if (!caseId.ok) {
    throw new Error(caseId.error);
  }
  return { ...input, caseId: caseId.value };
}

export function runCedcoD02EvalCase(input: CedcoD02EvalCase): CedcoD02EvalResult {
  const actual = typeof input.actual === "function" ? input.actual() : input.actual;
  const failures = evaluateOutcome(input.expected, actual);
  const passed = failures.length === 0;
  return {
    caseId: input.caseId,
    type: input.type,
    severity: input.severity,
    name: input.name,
    passed,
    score: passed ? 1 : 0,
    failures,
    warnings: [],
    metadata: sanitizeMetadata(input.metadata),
  };
}

export function runCedcoD02EvalSuite(input: CedcoD02EvalSuite): CedcoD02EvalSuiteResult {
  const startedAt = new Date();
  const results = input.cases.map(runCedcoD02EvalCase);
  const completedAt = new Date();
  const criticalFailures = results.filter(
    (result) => result.severity === "critical" && !result.passed,
  );
  const weightedTotal = input.cases.reduce((sum, item) => sum + severityWeight(item.severity), 0);
  const weightedPassed = input.cases.reduce((sum, item, index) => {
    const result = results[index];
    return sum + (result?.passed ? severityWeight(item.severity) : 0);
  }, 0);
  const totals = createCedcoD02EvalScore({
    total: results.length,
    passed: results.filter((result) => result.passed).length,
    weightedPassed,
    weightedTotal,
    criticalFailed: criticalFailures.length,
  });
  const reportBase = {
    suiteName: input.suiteName,
    startedAt,
    completedAt,
    durationMs: Math.max(0, completedAt.getTime() - startedAt.getTime()),
    totals,
    results,
    criticalFailures,
  };

  return {
    ...reportBase,
    markdownReport: buildCedcoD02EvalMarkdownReport(reportBase),
    jsonReport: buildCedcoD02EvalJsonReport(reportBase),
  };
}

export function runCedcoD02EvalSuites(
  suites: readonly CedcoD02EvalSuite[],
): readonly CedcoD02EvalSuiteResult[] {
  return suites.map(runCedcoD02EvalSuite);
}

function evaluateOutcome(
  expected: CedcoD02EvalExpectedOutcome,
  actual: CedcoD02EvalActualOutcome,
): string[] {
  const failures: string[] = [];

  if (actual.passed !== expected.shouldPass) {
    failures.push(`expected shouldPass=${expected.shouldPass} but actual passed=${actual.passed}`);
  }

  if (expected.expectedStatus && actual.status !== expected.expectedStatus) {
    failures.push(`expected status ${expected.expectedStatus} but got ${actual.status ?? "none"}`);
  }

  for (const reason of expected.expectedBlockingReasons ?? []) {
    if (!(actual.blockingReasons ?? []).includes(reason)) {
      failures.push(`missing blocking reason: ${reason}`);
    }
  }

  if (
    expected.expectedHandoffRecommendation !== undefined &&
    actual.handoffRecommended !== expected.expectedHandoffRecommendation
  ) {
    failures.push("handoff recommendation did not match expected value");
  }

  for (const term of expected.expectedSafeSummaryContains ?? []) {
    if (!(actual.safeSummary ?? "").toLowerCase().includes(term.toLowerCase())) {
      failures.push(`safe summary missing expected term: ${term}`);
    }
  }

  const actualText = JSON.stringify(actual);
  for (const term of expected.forbiddenTerms ?? []) {
    if (actualText.toLowerCase().includes(term.toLowerCase())) {
      failures.push(`forbidden term returned: ${term}`);
    }
  }

  for (const field of expected.forbiddenFields ?? []) {
    if ((actual.returnedFields ?? []).includes(field)) {
      failures.push(`forbidden field returned: ${field}`);
    }
  }

  for (const metric of expected.expectedMetrics ?? []) {
    if (!(actual.metrics ?? []).includes(metric)) {
      failures.push(`missing metric: ${metric}`);
    }
  }

  for (const auditEvent of expected.expectedAuditEvents ?? []) {
    if (!(actual.auditEvents ?? []).includes(auditEvent)) {
      failures.push(`missing audit event: ${auditEvent}`);
    }
  }

  for (const denial of expected.expectedPolicyDenials ?? []) {
    if (!(actual.policyDenials ?? []).includes(denial)) {
      failures.push(`missing policy denial: ${denial}`);
    }
  }

  if (expected.expectedNoProviderEgress && actual.providerEgressDetected) {
    failures.push("provider egress detected");
  }
  if (expected.expectedNoRealCall && actual.realCallDetected) {
    failures.push("real call detected");
  }
  if (expected.expectedNoPii && actual.piiDetected) {
    failures.push("PII detected");
  }

  const safety = combineAssertions([
    assertNoPii(actual),
    assertNoRawTranscript(actual),
    assertNoAudioUrl(actual),
    assertNoSecrets(actual),
    assertNoRealCall(actual),
    assertNoProviderEgress(actual),
    assertNoClinicalDiagnosis(actual),
    assertNoClinicalTriage(actual),
    assertNoR03(actual),
    ...(expected.expectedAuditEvents ? [assertAuditPresent(actual)] : []),
    ...(expected.expectedMetrics ? [assertMetricsPresent(actual)] : []),
  ]);
  failures.push(...safety.failures);

  return failures;
}
