import { describe, expect, it } from "vitest";
import { createApiApp } from "../app";

const headers = {
  "x-actor-id": "actor-test",
  "x-actor-roles": "tenant-admin",
  "x-correlation-id": "corr-dashboard-api-001",
};
const baseUrl = "/api/v1/tenants/cedco-test/operations/dashboard";
const d02DashboardUrl = "/api/v1/tenants/cedco-test/products/cedco/d02/dashboard";
const d02DashboardCssUrl =
  "/api/v1/tenants/cedco-test/products/cedco/d02/styles/operational-dashboard.css";
const d02ReportUrl = "/api/v1/tenants/cedco-test/products/cedco/d02/reports/operational-summary";

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

  it("renders CEDCO D02 dashboard HTML as a safe operator surface", async () => {
    const app = await createApiApp();
    const response = await app.inject({ method: "GET", url: d02DashboardUrl, headers });
    expect(response.statusCode).toBe(200);
    expect(response.headers["content-type"]).toContain("text/html");
    expect(response.body).toContain("CEDCO D02 Operations");
    expect(response.body).toContain("Mock-only environment");
    expect(response.body).not.toMatch(/phoneNumber|rawTranscript|audioUrl|token|rawPayload/iu);
    await app.close();
  });

  it("serves CEDCO D02 dashboard stylesheet without provider data", async () => {
    const app = await createApiApp();
    const response = await app.inject({ method: "GET", url: d02DashboardCssUrl, headers });
    expect(response.statusCode).toBe(200);
    expect(response.headers["content-type"]).toContain("text/css");
    expect(response.body).toContain("dashboard-shell");
    expect(response.body).not.toMatch(/phoneNumber|rawTranscript|audioUrl|token|rawPayload/iu);
    await app.close();
  });

  it("returns CEDCO D02 operational report with live providers and fixed assets excluded", async () => {
    const app = await createApiApp();
    const response = await app.inject({ method: "GET", url: d02ReportUrl, headers });
    const body = response.json<Envelope>();
    expect(response.statusCode).toBe(200);
    expect(body.data?.scope).toMatchObject({
      runtimeMode: "staging_safe_mock_only",
      realCallsEnabled: false,
      continuousCallsEnabled: false,
      providerEgressEnabled: false,
      pbxRuntimeConnected: false,
      inventoryVerticalIncluded: false,
    });
    expect(body.data?.kpis).toBeDefined();
    expect(JSON.stringify(body.data)).not.toMatch(/phoneNumber|rawTranscript|audioUrl|token/iu);
    await app.close();
  });

  it("protects CEDCO D02 dashboard with local-staging session auth", async () => {
    const app = await createApiApp({ authMode: "local-staging" });
    const anonymous = await app.inject({ method: "GET", url: d02DashboardUrl });
    expect(anonymous.statusCode).toBe(401);

    const login = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: {
        tenantId: "cedco-test",
        loginRef: "cedco-admin",
        credential: "valid-local-staging-credential",
      },
    });
    const sessionToken = login.json<Envelope<{ sessionToken: string }>>().data?.sessionToken;
    expect(login.statusCode).toBe(200);
    expect(sessionToken).toBeDefined();

    const dashboard = await app.inject({
      method: "GET",
      url: d02DashboardUrl,
      headers: { authorization: `Bearer ${sessionToken}` },
    });
    expect(dashboard.statusCode).toBe(200);
    expect(dashboard.body).toContain("CEDCO D02 Operations");
    await app.close();
  });
});

async function getDashboard(app: Awaited<ReturnType<typeof createApiApp>>) {
  const response = await app.inject({ method: "GET", url: baseUrl, headers });
  return response.json<Envelope>();
}
