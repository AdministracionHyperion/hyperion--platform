import { describe, expect, it } from "vitest";
import {
  mockProviderEventFixture,
  mockProviderEventHeaders,
  unsafeProviderEventPayloads,
} from "../../../../packages/testing/src";
import { createApiApp } from "../app";

interface Envelope<T = Record<string, unknown>> {
  readonly ok: boolean;
  readonly data?: T;
  readonly error?: { readonly code: string };
  readonly meta: { readonly correlationId: string };
}

const url = "/api/v1/tenants/cedco-test/voice/mock-provider-events";

describe("mock provider event ingestion API", () => {
  it("accepts mock provider event with valid synthetic signature", async () => {
    const app = await createApiApp();
    const response = await postProviderEvent(app);
    const body = response.json<Envelope>();

    expect(response.statusCode).toBe(202);
    expect(body.data).toMatchObject({
      eventId: "provider-event-001",
      status: "processed",
      processed: true,
    });
    await app.close();
  });

  it("does not expose raw payload", async () => {
    const app = await createApiApp();
    const response = await postProviderEvent(app);
    expect(JSON.stringify(response.json())).not.toMatch(/rawPayload|rawTranscript|audioUrl/u);
    await app.close();
  });

  it("rejects missing signature", async () => {
    const app = await createApiApp();
    const { "x-hyperion-mock-signature": _signature, ...headersWithoutSignature } =
      mockProviderEventHeaders;
    const response = await app.inject({
      method: "POST",
      url,
      headers: headersWithoutSignature,
      payload: { ...mockProviderEventFixture, eventId: "provider-event-missing-signature" },
    });
    expect(response.statusCode).toBe(403);
    await app.close();
  });

  it("rejects invalid signature", async () => {
    const app = await createApiApp();
    const response = await app.inject({
      method: "POST",
      url,
      headers: { ...mockProviderEventHeaders, "x-hyperion-mock-signature": "invalid" },
      payload: { ...mockProviderEventFixture, eventId: "provider-event-invalid-signature" },
    });
    expect(response.statusCode).toBe(403);
    await app.close();
  });

  it("blocks replay event", async () => {
    const app = await createApiApp();
    const first = await postProviderEvent(app);
    const second = await postProviderEvent(app);
    expect(first.statusCode).toBe(202);
    expect(second.statusCode).toBe(409);
    await app.close();
  });

  it.each([
    ["phoneNumber", unsafeProviderEventPayloads.phoneNumber],
    ["rawTranscript", unsafeProviderEventPayloads.rawTranscript],
    ["audioUrl", unsafeProviderEventPayloads.audioUrl],
    ["token", unsafeProviderEventPayloads.credential],
  ] as const)("rejects %s", async (_name, unsafePatch) => {
    const app = await createApiApp();
    const response = await app.inject({
      method: "POST",
      url,
      headers: mockProviderEventHeaders,
      payload: {
        ...mockProviderEventFixture,
        eventId: `provider-event-${_name.toLowerCase()}`,
        ...unsafePatch,
      },
    });
    expect(response.statusCode).toBe(400);
    await app.close();
  });

  it("rejects future provider source", async () => {
    const app = await createApiApp();
    const response = await app.inject({
      method: "POST",
      url,
      headers: mockProviderEventHeaders,
      payload: {
        ...mockProviderEventFixture,
        eventId: "provider-event-future-source",
        source: "future_elevenlabs",
      },
    });
    expect(response.statusCode).toBe(400);
    await app.close();
  });

  it("rejects providerCallRef without mock prefix", async () => {
    const app = await createApiApp();
    const response = await app.inject({
      method: "POST",
      url,
      headers: mockProviderEventHeaders,
      payload: {
        ...mockProviderEventFixture,
        eventId: "provider-event-bad-ref",
        providerCallRef: "provider-real-001",
      },
    });
    expect(response.statusCode).toBe(400);
    await app.close();
  });

  it("rejects runtimeMode=real and real/provider flags", async () => {
    const app = await createApiApp();
    const realMode = await app.inject({
      method: "POST",
      url,
      headers: mockProviderEventHeaders,
      payload: {
        ...mockProviderEventFixture,
        eventId: "provider-event-real-mode",
        runtimeMode: "real",
      },
    });
    const realCalls = await app.inject({
      method: "POST",
      url,
      headers: mockProviderEventHeaders,
      payload: {
        ...mockProviderEventFixture,
        eventId: "provider-event-real-calls",
        realCallsEnabled: true,
      },
    });
    const egress = await app.inject({
      method: "POST",
      url,
      headers: mockProviderEventHeaders,
      payload: {
        ...mockProviderEventFixture,
        eventId: "provider-event-provider-egress",
        providerEgressEnabled: true,
      },
    });
    expect(realMode.statusCode).toBe(400);
    expect(realCalls.statusCode).toBe(403);
    expect(egress.statusCode).toBe(403);
    await app.close();
  });

  it("preserves correlationId and records audit/metrics", async () => {
    const app = await createApiApp();
    const response = await postProviderEvent(app);
    const body = response.json<Envelope>();
    expect(body.meta.correlationId).toBe("corr-provider-event-001");
    expect(body.data?.metricsSnapshot).toBeDefined();
    await app.close();
  });
});

function postProviderEvent(app: Awaited<ReturnType<typeof createApiApp>>) {
  return app.inject({
    method: "POST",
    url,
    headers: mockProviderEventHeaders,
    payload: mockProviderEventFixture,
  });
}
