import { describe, expect, it } from "vitest";
import { createApiApp } from "../app";

const headers = {
  "x-actor-id": "actor-test",
  "x-actor-roles": "tenant-admin",
  "x-correlation-id": "corr-dashboard-api-001",
};
const baseUrl = "/api/v1/tenants/cedco-test/operations/dashboard";

interface Envelope<T = Record<string, unknown>> {
  readonly ok: boolean;
  readonly data?: T;
  readonly meta: { readonly correlationId: string };
}

describe("operations dashboard API", () => {
  it("GET operations dashboard responds 200", async () => {
    const app = await createApiApp();
    const response = await app.inject({ method: "GET", url: baseUrl, headers });
    expect(response.statusCode).toBe(200);
    await app.close();
  });

  it("response contains summaryCards, runtimeSafety and evalSummary", async () => {
    const app = await createApiApp();
    const body = await getDashboard(app);
    expect(body.data?.summaryCards).toBeDefined();
    expect(body.data?.runtimeSafety).toBeDefined();
    expect(body.data?.evalSummary).toBeDefined();
    await app.close();
  });

  it("preserves correlationId", async () => {
    const app = await createApiApp();
    const body = await getDashboard(app);
    expect(body.meta.correlationId).toBe("corr-dashboard-api-001");
    await app.close();
  });

  it.each(["phoneNumber", "rawTranscript", "audioUrl", "token", "rawPayload"] as const)(
    "does not expose %s",
    async (field) => {
      const app = await createApiApp();
      const body = await getDashboard(app);
      expect(JSON.stringify(body)).not.toContain(field);
      await app.close();
    },
  );

  it("dashboard endpoints are GET-only", async () => {
    const app = await createApiApp();
    const response = await app.inject({ method: "POST", url: baseUrl, headers });
    expect([403, 404, 405]).toContain(response.statusCode);
    await app.close();
  });

  it("does not expose dispatch endpoint", async () => {
    const app = await createApiApp();
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/tenants/cedco-test/operations/dashboard/dispatch",
      headers,
    });
    expect([403, 404, 405]).toContain(response.statusCode);
    await app.close();
  });

  it("returns mock call flow, provider event and eval subsections", async () => {
    const app = await createApiApp();
    const [flows, events, evals] = await Promise.all([
      app.inject({ method: "GET", url: `${baseUrl}/mock-call-flows`, headers }),
      app.inject({ method: "GET", url: `${baseUrl}/provider-events`, headers }),
      app.inject({ method: "GET", url: `${baseUrl}/evals`, headers }),
    ]);
    expect(flows.statusCode).toBe(200);
    expect(events.statusCode).toBe(200);
    expect(evals.statusCode).toBe(200);
    await app.close();
  });
});

async function getDashboard(app: Awaited<ReturnType<typeof createApiApp>>) {
  const response = await app.inject({ method: "GET", url: baseUrl, headers });
  return response.json<Envelope>();
}
