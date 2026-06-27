import { describe, expect, it } from "vitest";
import { createJobEnvelope, createJobId, type JobType } from "../core";
import { createWorkerApp } from "../worker-app";

describe("worker mock call runtime jobs", () => {
  it("runs voice.call.mock_session.run", async () => {
    const result = await runJob("job-mock-session-run", "voice.call.mock_session.run");
    expect(result?.success).toBe(true);
    expect(String(result?.output?.providerCallRef)).toContain("mock_call_");
  });

  it("finalizes voice.call.mock_session.finalize", async () => {
    const app = createWorkerApp();
    await app.queue.enqueue(job("job-mock-session-run-2", "voice.call.mock_session.run"));
    await app.runner.processNext();
    await app.queue.enqueue(
      job("job-mock-session-finalize", "voice.call.mock_session.finalize", {
        sessionId: "mock-session-corr-worker-mock-001",
      }),
    );
    const result = await app.runner.processNext();
    expect(result?.output).toMatchObject({ status: "completed" });
  });

  it("runs cedco_d02.mock_flow.run", async () => {
    const result = await runJob("job-mock-d02-flow", "cedco_d02.mock_flow.run");
    expect(result?.output).toMatchObject({ status: "completed", eventsCount: 4 });
  });

  it.each(["rawTranscript", "audioUrl", "realCallsEnabled"] as const)(
    "blocks unsafe mock job payload %s",
    async (field) => {
      const result = await runJob(
        "job-mock-blocked-" + field.toLowerCase(),
        "cedco_d02.mock_flow.run",
        {
          [field]: field === "realCallsEnabled" ? true : "blocked",
        },
      );
      expect(result?.status).toBe("blocked");
    },
  );

  it("increments worker metrics", async () => {
    const app = createWorkerApp();
    await app.queue.enqueue(job("job-mock-metrics", "cedco_d02.mock_flow.run"));
    await app.runner.processNext();
    expect(app.services.metrics.snapshot().counters.length).toBeGreaterThan(0);
  });

  it("does not create provider SDK output", async () => {
    const result = await runJob("job-mock-no-provider", "voice.call.mock_session.run");
    expect(JSON.stringify(result)).not.toMatch(/elevenlabs|twilio|sip/iu);
  });
});

async function runJob(id: string, type: JobType, payload: Readonly<Record<string, unknown>> = {}) {
  const app = createWorkerApp();
  await app.queue.enqueue(job(id, type, payload));
  return app.runner.processNext();
}

function job(id: string, type: JobType, payload: Readonly<Record<string, unknown>> = {}) {
  const jobId = createJobId(id);
  if (!jobId.ok) throw new Error("invalid job id");
  return createJobEnvelope({
    jobId: jobId.value,
    type,
    tenantId: "cedco-test",
    actorId: "actor-test",
    correlationId: "corr-worker-mock-001",
    payload: {
      cedcoSiteId: "bucaramanga",
      serviceId: "odontologia-general-test",
      agreementId: "convenio-test",
      safeContactRef: "safe-contact-ref-001",
      patientContextRef: "cedco-context-ref-001",
      consentRef: "cedco-consent-ref-001",
      ...payload,
    },
  });
}
