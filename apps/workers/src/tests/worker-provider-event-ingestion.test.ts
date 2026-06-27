import { describe, expect, it } from "vitest";
import { mockProviderEventFixture } from "../../../../packages/testing/src";
import { createJobEnvelope, createJobId, type JobEnvelope, type JobType } from "../core";
import { createWorkerApp } from "../worker-app";

describe("worker provider event ingestion jobs", () => {
  it("voice.provider_event.sanitized.process processes safe event", async () => {
    const result = await runJob(
      jobFixture("job-provider-event-001", "voice.provider_event.sanitized.process", {
        eventId: mockProviderEventFixture.eventId,
        type: mockProviderEventFixture.type,
        providerCallRef: mockProviderEventFixture.providerCallRef,
        safeCallSessionRef: "mock-session-provider-event-001",
        normalizedStatus: "post_call_available",
        safeSummary: mockProviderEventFixture.safeSummary,
        postCallAvailable: true,
      }),
    );
    expect(result?.success).toBe(true);
    expect(result?.output?.processed).toBe(true);
  });

  it("cedco_d02.post_call_event.process processes safe post-call event", async () => {
    const result = await runJob(
      jobFixture("job-d02-post-call-001", "cedco_d02.post_call_event.process", {
        eventId: mockProviderEventFixture.eventId,
        type: mockProviderEventFixture.type,
        providerCallRef: mockProviderEventFixture.providerCallRef,
        safeCallSessionRef: "mock-session-provider-event-001",
        safeSummary: mockProviderEventFixture.safeSummary,
        safeOutcome: "mock_completed",
      }),
    );
    expect(result?.success).toBe(true);
    expect(result?.output?.safeSummary).toContain("Synthetic");
  });

  it.each(["rawTranscript", "phoneNumber", "token"] as const)(
    "blocks job with %s",
    async (field) => {
      const result = await runJob(
        jobFixture("job-provider-event-blocked", "voice.provider_event.sanitized.process", {
          eventId: "provider-event-blocked",
          type: "provider.mock.post_call.available",
          providerCallRef: "mock_call_blocked_001",
          [field]: "blocked",
        }),
      );
      expect(result?.status).toBe("blocked");
    },
  );

  it("increments worker metrics for safe job", async () => {
    const app = createWorkerApp();
    await app.queue.enqueue(
      jobFixture("job-provider-event-metrics", "voice.provider_event.sanitized.process", {
        eventId: "provider-event-metrics",
        type: "provider.mock.call.completed",
        providerCallRef: "mock_call_metrics_001",
        safeSummary: "Synthetic summary.",
      }),
    );
    await app.runner.processNext();
    expect(app.services.metrics.snapshot().counters.length).toBeGreaterThan(0);
  });

  it("does not touch provider SDK, network, or daemon concepts", async () => {
    const result = await runJob(
      jobFixture("job-provider-event-safe-scope", "cedco_d02.post_call_event.process", {
        eventId: "provider-event-safe-scope",
        type: "provider.mock.post_call.available",
        providerCallRef: "mock_call_safe_scope_001",
        safeSummary: "Synthetic safe scope.",
      }),
    );
    expect(JSON.stringify(result)).not.toMatch(/sdk|fetch|daemon|providerEgress/iu);
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
  payload: Readonly<Record<string, unknown>>,
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
    correlationId: "corr-worker-provider-event-001",
    payload,
  });
}
