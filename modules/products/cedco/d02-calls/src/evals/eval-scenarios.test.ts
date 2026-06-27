import { describe, expect, it } from "vitest";
import {
  cedcoD02ClinicalBoundaryScenarios,
  cedcoD02ComplianceScenarios,
  cedcoD02EligibilityScenarios,
  cedcoD02FullEvalSuite,
  cedcoD02HandoffScenarios,
  cedcoD02MockRuntimeRegressionScenarios,
  cedcoD02ProviderEventRegressionScenarios,
  cedcoD02ReadinessScenarios,
  cedcoD02SchedulingScenarios,
  cedcoD02UnsafePayloadScenarios,
  runCedcoD02EvalCase,
  runCedcoD02EvalSuite,
} from "./index";

describe("CEDCO D02 eval scenarios", () => {
  it("readiness valid case passes", () => {
    expect(runCedcoD02EvalCase(cedcoD02ReadinessScenarios[0]!).passed).toBe(true);
  });

  it("readiness without consent reference fails safely", () => {
    expect(runCedcoD02EvalCase(cedcoD02ReadinessScenarios[1]!).passed).toBe(true);
  });

  it("readiness with contact data fails safely", () => {
    expect(runCedcoD02EvalCase(cedcoD02ReadinessScenarios[9]!).passed).toBe(true);
  });

  it("compliance general orientation passes", () => {
    expect(runCedcoD02EvalCase(cedcoD02ComplianceScenarios[0]!).passed).toBe(true);
  });

  it("compliance clinical conclusion request fails safely", () => {
    expect(runCedcoD02EvalCase(cedcoD02ComplianceScenarios[1]!).passed).toBe(true);
  });

  it("compliance clinical prioritization fails safely", () => {
    expect(runCedcoD02EvalCase(cedcoD02ComplianceScenarios[2]!).passed).toBe(true);
  });

  it("scheduling conceptual guidance passes", () => {
    expect(runCedcoD02EvalCase(cedcoD02SchedulingScenarios[0]!).passed).toBe(true);
  });

  it("scheduling integration real path fails safely", () => {
    expect(runCedcoD02EvalCase(cedcoD02SchedulingScenarios[1]!).passed).toBe(true);
  });

  it("eligibility conceptual guidance passes", () => {
    expect(runCedcoD02EvalCase(cedcoD02EligibilityScenarios[0]!).passed).toBe(true);
  });

  it("eligibility integration real path fails safely", () => {
    expect(runCedcoD02EvalCase(cedcoD02EligibilityScenarios[1]!).passed).toBe(true);
  });

  it("handoff human request passes", () => {
    expect(runCedcoD02EvalCase(cedcoD02HandoffScenarios[3]!).passed).toBe(true);
  });

  it("handoff ambiguous case passes", () => {
    expect(runCedcoD02EvalCase(cedcoD02HandoffScenarios[1]!).passed).toBe(true);
  });

  it("unsafe credential-like value fails safely", () => {
    expect(runCedcoD02EvalCase(cedcoD02UnsafePayloadScenarios[6]!).passed).toBe(true);
  });

  it("unsafe audio-like value fails safely", () => {
    expect(runCedcoD02EvalCase(cedcoD02UnsafePayloadScenarios[4]!).passed).toBe(true);
  });

  it("unsafe provider URL-like value fails safely", () => {
    expect(runCedcoD02EvalCase(cedcoD02UnsafePayloadScenarios[11]!).passed).toBe(true);
  });

  it("clinical treatment recommendation fails safely", () => {
    expect(runCedcoD02EvalCase(cedcoD02ClinicalBoundaryScenarios[1]!).passed).toBe(true);
  });

  it("mock call runtime full flow passes eval", () => {
    expect(runCedcoD02EvalCase(cedcoD02MockRuntimeRegressionScenarios[0]!).passed).toBe(true);
  });

  it("mock provider event valid path passes eval", () => {
    expect(runCedcoD02EvalCase(cedcoD02ProviderEventRegressionScenarios[0]!).passed).toBe(true);
  });

  it("replay provider event fails safely", () => {
    expect(runCedcoD02EvalCase(cedcoD02ProviderEventRegressionScenarios[1]!).passed).toBe(true);
  });

  it("future real provider source fails safely", () => {
    expect(runCedcoD02EvalCase(cedcoD02ProviderEventRegressionScenarios[3]!).passed).toBe(true);
  });

  it("provider call reference without mock prefix fails safely", () => {
    expect(runCedcoD02EvalCase(cedcoD02ProviderEventRegressionScenarios[4]!).passed).toBe(true);
  });

  it("post-call safe summary passes eval", () => {
    expect(runCedcoD02EvalCase(cedcoD02ProviderEventRegressionScenarios[6]!).passed).toBe(true);
  });

  it("post-call unsafe text fails safely", () => {
    expect(runCedcoD02EvalCase(cedcoD02ComplianceScenarios[9]!).passed).toBe(true);
  });

  it("expected metrics are present", () => {
    expect(runCedcoD02EvalCase(cedcoD02MockRuntimeRegressionScenarios[5]!).passed).toBe(true);
  });

  it("expected audit is present", () => {
    expect(runCedcoD02EvalCase(cedcoD02MockRuntimeRegressionScenarios[5]!).passed).toBe(true);
  });

  it("correlation id is preserved in full suite results", () => {
    const suite = runCedcoD02EvalSuite(cedcoD02FullEvalSuite);
    expect(JSON.stringify(suite)).toContain("correlation");
  });

  it("full suite passes without critical failures", () => {
    const suite = runCedcoD02EvalSuite(cedcoD02FullEvalSuite);
    expect(suite.totals.grade).toBe("pass");
    expect(suite.totals.criticalFailed).toBe(0);
    expect(suite.totals.total).toBeGreaterThanOrEqual(75);
  });
});
