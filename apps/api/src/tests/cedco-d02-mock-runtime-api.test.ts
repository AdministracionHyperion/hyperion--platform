import { describe, expect, it } from "vitest";
import { cedcoD02MockFlowFixture, cedcoD02MockHeaders } from "../../../../packages/testing/src";
import { createApiApp } from "../app";

interface Envelope<T = Record<string, unknown>> {
  readonly ok: boolean;
  readonly data?: T;
  readonly error?: { readonly code: string };
  readonly meta: { readonly correlationId: string };
}

const url = "/api/v1/tenants/cedco-test/products/cedco/d02/mock-call-flows";

describe("CEDCO D02 mock runtime API", () => {
  it("runs a mock call flow", async () => {
    const app = await createApiApp();
    const response = await app.inject({
      method: "POST",
      url,
      headers: cedcoD02MockHeaders,
      payload: cedcoD02MockFlowFixture,
    });

    expect(response.statusCode).toBe(201);
    expect(response.json<Envelope>().data).toMatchObject({
      status: "completed",
      eventsCount: 4,
    });
    await app.close();
  });

  it("returns flowId, sessionId, and synthetic providerCallRef", async () => {
    const app = await createApiApp();
    const body = await postMockFlow(app);
    expect(body.data?.flowId).toBe("mock-flow-corr-cedco-mock-api-001");
    expect(String(body.data?.sessionId)).toContain("mock-session-");
    expect(String(body.data?.providerCallRef)).toContain("mock_call_");
    await app.close();
  });

  it("does not expose phone or raw transcript", async () => {
    const app = await createApiApp();
    const body = await postMockFlow(app);
    const serialized = JSON.stringify(body);
    expect(serialized).not.toMatch(/phoneNumber|to_number|rawTranscript|audioUrl/u);
    await app.close();
  });

  it("accepts allowlisted mock-flow metadata", async () => {
    const app = await createApiApp();
    const response = await app.inject({
      method: "POST",
      url,
      headers: cedcoD02MockHeaders,
      payload: {
        ...cedcoD02MockFlowFixture,
        metadata: { source: "synthetic-test", scenarioId: "mock-flow-safe-metadata" },
      },
    });
    expect(response.statusCode).toBe(201);
    await app.close();
  });

  it("rejects non-allowlisted mock-flow metadata keys", async () => {
    const app = await createApiApp();
    const response = await app.inject({
      method: "POST",
      url,
      headers: cedcoD02MockHeaders,
      payload: { ...cedcoD02MockFlowFixture, metadata: { unexpected: "blocked" } },
    });
    expect(response.statusCode).toBe(400);
    await app.close();
  });

  it.each(["phoneNumber", "rawTranscript", "audioUrl", "token"] as const)(
    "rejects payload with %s",
    async (field) => {
      const app = await createApiApp();
      const response = await app.inject({
        method: "POST",
        url,
        headers: cedcoD02MockHeaders,
        payload: { ...cedcoD02MockFlowFixture, metadata: { [field]: "blocked" } },
      });
      expect(response.statusCode).toBe(400);
      await app.close();
    },
  );

  it("rejects runtimeMode=real", async () => {
    const app = await createApiApp();
    const response = await app.inject({
      method: "POST",
      url,
      headers: cedcoD02MockHeaders,
      payload: { ...cedcoD02MockFlowFixture, runtimeMode: "real" },
    });
    expect(response.statusCode).toBe(400);
    await app.close();
  });

  it("rejects realCallsEnabled=true", async () => {
    const app = await createApiApp();
    const response = await app.inject({
      method: "POST",
      url,
      headers: cedcoD02MockHeaders,
      payload: { ...cedcoD02MockFlowFixture, realCallsEnabled: true },
    });
    expect(response.statusCode).toBe(403);
    await app.close();
  });

  it("rejects providerEgressEnabled=true", async () => {
    const app = await createApiApp();
    const response = await app.inject({
      method: "POST",
      url,
      headers: cedcoD02MockHeaders,
      payload: { ...cedcoD02MockFlowFixture, providerEgressEnabled: true },
    });
    expect(response.statusCode).toBe(403);
    await app.close();
  });

  it("preserves correlationId", async () => {
    const app = await createApiApp();
    const body = await postMockFlow(app);
    expect(body.meta.correlationId).toBe("corr-cedco-mock-api-001");
    await app.close();
  });
});

async function postMockFlow(app: Awaited<ReturnType<typeof createApiApp>>) {
  const response = await app.inject({
    method: "POST",
    url,
    headers: cedcoD02MockHeaders,
    payload: cedcoD02MockFlowFixture,
  });
  return response.json<Envelope>();
}
