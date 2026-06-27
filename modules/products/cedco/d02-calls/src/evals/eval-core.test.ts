import { describe, expect, it } from "vitest";
import {
  assertNoAudioUrl,
  assertNoClinicalDiagnosis,
  assertNoClinicalTriage,
  assertNoPii,
  assertNoProviderEgress,
  assertNoR03,
  assertNoRawTranscript,
  assertNoRealCall,
  assertNoSecrets,
  buildCedcoD02EvalJsonReport,
  buildCedcoD02EvalMarkdownReport,
  cedcoD02FullEvalSuite,
  createCedcoD02EvalCaseId,
  defineCedcoD02EvalCase,
  runCedcoD02EvalCase,
  runCedcoD02EvalSuite,
} from "./index";
import { actualControlledFailure, actualPass, expectedPass } from "./eval-fixtures";

describe("CEDCO D02 eval core", () => {
  it("validates EvalCaseId format", () => {
    expect(createCedcoD02EvalCaseId("cedco-d02.readiness.1").ok).toBe(true);
    expect(createCedcoD02EvalCaseId("cedco.readiness.1").ok).toBe(false);
  });

  it("runs a passing case", () => {
    const result = runCedcoD02EvalCase(
      defineCedcoD02EvalCase({
        caseId: "cedco-d02.readiness.900",
        type: "readiness",
        severity: "info",
        name: "passing case",
        expected: expectedPass(),
        actual: actualPass(),
      }),
    );
    expect(result.passed).toBe(true);
  });

  it("marks a failed case", () => {
    const result = runCedcoD02EvalCase(
      defineCedcoD02EvalCase({
        caseId: "cedco-d02.readiness.901",
        type: "readiness",
        severity: "critical",
        name: "failed case",
        expected: expectedPass(),
        actual: actualControlledFailure(["unexpected_block"]),
      }),
    );
    expect(result.passed).toBe(false);
  });

  it("blocks suite on critical failure", () => {
    const suite = runCedcoD02EvalSuite({
      suiteName: "Critical Failure Suite",
      cases: [
        defineCedcoD02EvalCase({
          caseId: "cedco-d02.readiness.902",
          type: "readiness",
          severity: "critical",
          name: "critical failure",
          expected: expectedPass(),
          actual: actualControlledFailure(["unexpected_block"]),
        }),
      ],
    });
    expect(suite.totals.grade).toBe("blocked");
    expect(suite.criticalFailures).toHaveLength(1);
  });

  it("calculates weightedPercentage correctly", () => {
    const suite = runCedcoD02EvalSuite({
      suiteName: "Weighted Suite",
      cases: [
        defineCedcoD02EvalCase({
          caseId: "cedco-d02.readiness.903",
          type: "readiness",
          severity: "info",
          name: "pass",
          expected: expectedPass(),
          actual: actualPass(),
        }),
        defineCedcoD02EvalCase({
          caseId: "cedco-d02.readiness.904",
          type: "readiness",
          severity: "high",
          name: "fail",
          expected: expectedPass(),
          actual: actualControlledFailure(["unexpected_block"]),
        }),
      ],
    });
    expect(suite.totals.weightedPercentage).toBe(20);
  });

  it("builds markdown report", () => {
    const suite = runCedcoD02EvalSuite(cedcoD02FullEvalSuite);
    expect(buildCedcoD02EvalMarkdownReport(suite)).toContain("CEDCO D02 Full");
  });

  it("builds json report", () => {
    const suite = runCedcoD02EvalSuite(cedcoD02FullEvalSuite);
    expect(() => JSON.parse(buildCedcoD02EvalJsonReport(suite))).not.toThrow();
  });

  it("report does not contain PII", () => {
    const suite = runCedcoD02EvalSuite(cedcoD02FullEvalSuite);
    expect(assertNoPii(suite.markdownReport).passed).toBe(true);
  });

  it("report does not contain raw conversation text", () => {
    const suite = runCedcoD02EvalSuite(cedcoD02FullEvalSuite);
    expect(assertNoRawTranscript(suite.jsonReport).passed).toBe(true);
  });

  it("report does not contain secrets", () => {
    const suite = runCedcoD02EvalSuite(cedcoD02FullEvalSuite);
    expect(assertNoSecrets(suite.jsonReport).passed).toBe(true);
  });
});

describe("CEDCO D02 eval assertions", () => {
  it("detects phone-like values", () => {
    expect(assertNoPii({ contact: "+570000000000" }).passed).toBe(false);
  });

  it("detects email-like values", () => {
    expect(assertNoPii({ contact: "synthetic@example.invalid" }).passed).toBe(false);
  });

  it("detects document-like fields", () => {
    expect(assertNoPii({ documentNumber: "synthetic-document" }).passed).toBe(false);
  });

  it("detects raw conversation field", () => {
    expect(assertNoRawTranscript({ rawTranscript: "blocked" }).passed).toBe(false);
  });

  it("detects audio URL field", () => {
    expect(assertNoAudioUrl({ audioUrl: "https://blocked.invalid/file.wav" }).passed).toBe(false);
  });

  it("detects secret fields", () => {
    expect(assertNoSecrets({ token: "blocked" }).passed).toBe(false);
  });

  it("detects real call enablement", () => {
    expect(assertNoRealCall({ realCallsEnabled: true }).passed).toBe(false);
  });

  it("detects provider egress enablement", () => {
    expect(assertNoProviderEgress({ providerEgressEnabled: true }).passed).toBe(false);
  });

  it("detects clinical conclusion language", () => {
    expect(assertNoClinicalDiagnosis("diagnóstico directo").passed).toBe(false);
  });

  it("detects clinical prioritization language", () => {
    expect(assertNoClinicalTriage("triage clínico").passed).toBe(false);
  });

  it("detects out-of-scope product marker", () => {
    const marker = `r${"03"}`;
    expect(assertNoR03(marker).passed).toBe(false);
  });
});
