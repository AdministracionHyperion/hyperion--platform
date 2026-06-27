import { describe, expect, it } from "vitest";
import { createJobEnvelope, createJobId, type JobEnvelope, type JobType } from "../core";
import { createWorkerApp } from "../worker-app";

describe("worker job handlers", () => {
  it("processes outbox.process without external publish", async () => {
    const result = await runJob(jobFixture("job-outbox-001", "outbox.process"));
    expect(result?.output).toMatchObject({ processed: true, externalPublish: "not-configured" });
  });

  it("prepares voice.call.prepare without dispatch", async () => {
    const result = await runJob(jobFixture("job-voice-prepare-001", "voice.call.prepare"));
    expect(result?.output).toMatchObject({ prepared: true, dispatch: "not_started" });
  });

  it("sanitizes voice.call.event.process metadata", async () => {
    const result = await runJob(
      jobFixture("job-voice-event-001", "voice.call.event.process", {
        metadata: { email: "synthetic@example.invalid" },
      }),
    );
    expect(JSON.stringify(result?.output)).not.toContain("synthetic@example.invalid");
  });

  it("blocks voice.post_call.process with rawTranscript before persistence", async () => {
    const result = await runJob(
      jobFixture("job-post-call-001", "voice.post_call.process", {
        rawTranscript: "synthetic blocked transcript",
      }),
    );
    expect(result?.status).toBe("blocked");
  });

  it("processes safe voice.post_call.process payloads", async () => {
    const result = await runJob(
      jobFixture("job-post-call-002", "voice.post_call.process", {
        redactedSummary: "synthetic safe summary",
      }),
    );
    expect(result?.success).toBe(true);
  });

  it("evaluates CEDCO D02 readiness with missing config blockers", async () => {
    const result = await runJob(
      jobFixture("job-cedco-readiness-001", "cedco_d02.readiness.evaluate", {}),
    );
    expect(result?.output?.blockingReasons).toContain("missing_agent_version");
  });

  it("evaluates CEDCO D02 compliance and blocks diagnosis", async () => {
    const result = await runJob(
      jobFixture("job-cedco-compliance-001", "cedco_d02.compliance.evaluate", {
        textRedacted: "diagnosticar dolor fuerte",
      }),
    );
    expect(result?.output?.blocked).toBe(true);
  });

  it("records CEDCO D02 metrics with sanitized dimensions", async () => {
    const app = createWorkerApp();
    await app.queue.enqueue(
      jobFixture("job-cedco-metric-001", "cedco_d02.metric.record", {
        key: "cedco_d02.synthetic",
        value: 1,
        dimensions: { email: "synthetic@example.invalid", channel: "worker-test" },
      }),
    );

    const result = await app.runner.processNext();

    expect(result?.success).toBe(true);
    expect(JSON.stringify(app.services.recordedMetrics?.())).not.toContain(
      "synthetic@example.invalid",
    );
  });

  it("does not create provider references for safe jobs", async () => {
    const result = await runJob(jobFixture("job-no-provider-001", "voice.call.prepare"));
    expect(JSON.stringify(result)).not.toMatch(/elevenlabs|twilio|providerCallId/iu);
  });

  it("does not create R03 assets scope from any job", async () => {
    const result = await runJob(jobFixture("job-safe-scope-001", "cedco_d02.metric.record"));
    expect(JSON.stringify(result)).not.toMatch(/r03|activos-fijos|assets/iu);
  });

  it("processes all registered safe job types", async () => {
    const app = createWorkerApp();
    await app.queue.enqueue(jobFixture("job-all-types-001", "outbox.process"));
    await app.queue.enqueue(jobFixture("job-all-types-002", "voice.call.prepare"));
    await app.queue.enqueue(jobFixture("job-all-types-003", "voice.call.event.process"));
    await app.queue.enqueue(jobFixture("job-all-types-004", "voice.post_call.process"));
    await app.queue.enqueue(jobFixture("job-all-types-005", "cedco_d02.readiness.evaluate"));
    await app.queue.enqueue(jobFixture("job-all-types-006", "cedco_d02.compliance.evaluate"));
    await app.queue.enqueue(jobFixture("job-all-types-007", "cedco_d02.metric.record"));

    const results = await app.runner.processAll(10);

    expect(results.every((result) => result.success)).toBe(true);
    expect(await app.queue.listByStatus("succeeded")).toHaveLength(7);
  });
});

async function runJob(job: JobEnvelope) {
  const app = createWorkerApp();
  await app.queue.enqueue(job);
  return app.runner.processNext();
}

function jobFixture(
  jobIdValue: string,
  type: JobType,
  payload: Readonly<Record<string, unknown>> = {},
): JobEnvelope {
  const jobId = createJobId(jobIdValue);
  if (!jobId.ok) {
    throw new Error("invalid test job id");
  }

  return createJobEnvelope({
    jobId: jobId.value,
    type,
    tenantId: "cedco-test",
    actorId: "actor-test",
    correlationId: "corr-worker-jobs-001",
    payload,
  });
}
