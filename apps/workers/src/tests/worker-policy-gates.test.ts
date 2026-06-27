import { describe, expect, it } from "vitest";
import { InMemoryLogger, metricNames } from "../../../../packages/observability/src";
import { createJobEnvelope, createJobId, type JobEnvelope, type JobType } from "../core";
import { createWorkerApp } from "../worker-app";

describe("worker policy gates", () => {
  it("blocks jobs with realCallsEnabled=true", async () => {
    const result = await runBlockedJob("job-block-real-calls-001", {
      realCallsEnabled: true,
    });
    expect(result.status).toBe("blocked");
  });

  it("blocks jobs with providerEgressEnabled=true", async () => {
    const result = await runBlockedJob("job-block-provider-001", {
      providerEgressEnabled: true,
    });
    expect(result.status).toBe("blocked");
  });

  it("blocks jobs with productionDeployEnabled=true", async () => {
    const result = await runBlockedJob("job-block-production-001", {
      productionDeployEnabled: true,
    });
    expect(result.status).toBe("blocked");
  });

  it("blocks jobs with rawTranscript", async () => {
    const result = await runBlockedJob("job-block-transcript-001", {
      rawTranscript: "synthetic blocked transcript",
    });
    expect(result.status).toBe("blocked");
  });

  it("blocks jobs with audioUrl", async () => {
    const result = await runBlockedJob("job-block-audio-001", {
      audioUrl: "synthetic://blocked",
    });
    expect(result.status).toBe("blocked");
  });

  it("blocks jobs with token, secret, or apiKey", async () => {
    const result = await runBlockedJob("job-block-token-001", {
      token: "not-a-real-token",
      secret: "not-a-real-secret",
      apiKey: "not-a-real-key",
    });
    expect(result.status).toBe("blocked");
  });

  it("marks blocked jobs without executing handlers", async () => {
    const app = createWorkerApp();
    await app.queue.enqueue(
      jobFixture("job-block-handler-001", "outbox.process", {
        providerEgressEnabled: true,
      }),
    );

    await app.runner.processNext();

    expect(await app.queue.listByStatus("succeeded")).toHaveLength(0);
    expect(await app.queue.listByStatus("blocked")).toHaveLength(1);
  });

  it("increments worker_jobs_blocked_total for blocked jobs", async () => {
    const app = createWorkerApp();
    await app.queue.enqueue(
      jobFixture("job-block-metric-001", "outbox.process", {
        realCallsEnabled: true,
      }),
    );

    await app.runner.processNext();

    expect(
      app.services.metrics
        .snapshot()
        .counters.some((counter) => counter.name === metricNames.workerJobsBlockedTotal),
    ).toBe(true);
  });

  it("sanitizes blocked job logs", async () => {
    const app = createWorkerApp();
    await app.queue.enqueue(
      jobFixture("job-block-log-001", "outbox.process", {
        token: "not-a-real-token",
      }),
    );

    await app.runner.processNext();

    expect(JSON.stringify((app.services.logger as InMemoryLogger).getEntries())).not.toContain(
      "not-a-real-token",
    );
  });
});

async function runBlockedJob(jobId: string, payload: Readonly<Record<string, unknown>>) {
  const app = createWorkerApp();
  await app.queue.enqueue(jobFixture(jobId, "outbox.process", payload));
  const result = await app.runner.processNext();
  if (!result) {
    throw new Error("expected worker result");
  }
  return result;
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
    correlationId: "corr-worker-policy-001",
    payload,
  });
}
