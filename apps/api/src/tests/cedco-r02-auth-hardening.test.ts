import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { createApiApp } from "../app";
import { createFakeApiServices } from "../services";

interface Envelope<T = unknown> {
  readonly ok: boolean;
  readonly data?: T;
  readonly error?: { readonly code: string };
}

let app: FastifyInstance;

const tenantId = "cedco-demo";
const baseUrl = `/api/v1/tenants/${tenantId}/r02`;
const syntheticCredential = "valid-synthetic-credential";

beforeEach(async () => {
  app = await createApiApp({
    services: createFakeApiServices(),
    authMode: "local-staging",
  });
});

afterEach(async () => {
  await app.close();
});

describe("CEDCO R02 local staging auth hardening", () => {
  it("blocks anonymous R02 access in local-staging mode", async () => {
    const response = await app.inject({
      method: "GET",
      url: `${baseUrl}/dashboard`,
    });

    expect(response.statusCode).toBe(401);
    expect(response.json<Envelope>().error?.code).toBe("missing_actor");
  });

  it("logs in, resolves whoami and authorizes R02 dashboard with bearer session", async () => {
    const sessionToken = await login("cedco-admin");

    const whoami = await app.inject({
      method: "GET",
      url: "/api/v1/auth/whoami",
      headers: { authorization: `Bearer ${sessionToken}` },
    });
    expect(whoami.statusCode).toBe(200);
    expect(
      whoami.json<Envelope<{ principal: { roles: string[] } }>>().data?.principal.roles,
    ).toContain("cedco_admin");

    const dashboard = await app.inject({
      method: "GET",
      url: `${baseUrl}/dashboard`,
      headers: { authorization: `Bearer ${sessionToken}` },
    });
    expect(dashboard.statusCode).toBe(200);
    expect(dashboard.body).toContain("CEDCO R02 Operations");
  });

  it("denies viewer writes with DB-backed-role semantics", async () => {
    const sessionToken = await login("reports-viewer");
    const denied = await app.inject({
      method: "POST",
      url: `${baseUrl}/calendar/availability`,
      headers: { authorization: `Bearer ${sessionToken}` },
      payload: {
        slotId: "slot-r02-auth-denied",
        resourceId: "cedco-r02-recepcion",
        siteId: "cedco-main-site",
        serviceTypeId: "consulta-general",
        startsAt: "2026-07-08T14:00:00.000Z",
        endsAt: "2026-07-08T14:30:00.000Z",
        capacity: 1,
      },
    });

    expect(denied.statusCode).toBe(403);
  });

  it("allows operator operations but blocks compliance approval", async () => {
    const sessionToken = await login("r02-operator");

    const availability = await app.inject({
      method: "POST",
      url: `${baseUrl}/calendar/availability`,
      headers: { authorization: `Bearer ${sessionToken}` },
      payload: {
        slotId: "slot-r02-operator",
        resourceId: "cedco-r02-recepcion",
        siteId: "cedco-main-site",
        serviceTypeId: "consulta-general",
        startsAt: "2026-07-09T14:00:00.000Z",
        endsAt: "2026-07-09T14:30:00.000Z",
        capacity: 1,
      },
    });
    expect(availability.statusCode).toBe(201);

    const approval = await app.inject({
      method: "POST",
      url: `${baseUrl}/knowledge-documents/doc-r02-auth/approve`,
      headers: { authorization: `Bearer ${sessionToken}` },
    });
    expect(approval.statusCode).toBe(403);
  });

  it("logs out and invalidates the session", async () => {
    const sessionToken = await login("cedco-admin");
    const logout = await app.inject({
      method: "POST",
      url: "/api/v1/auth/logout",
      headers: { authorization: `Bearer ${sessionToken}` },
    });
    expect(logout.statusCode).toBe(200);

    const dashboard = await app.inject({
      method: "GET",
      url: `${baseUrl}/dashboard`,
      headers: { authorization: `Bearer ${sessionToken}` },
    });
    expect(dashboard.statusCode).toBe(401);
  });
});

async function login(loginRef: string): Promise<string> {
  const response = await app.inject({
    method: "POST",
    url: "/api/v1/auth/login",
    payload: {
      tenantId,
      loginRef,
      credential: syntheticCredential,
    },
  });
  expect(response.statusCode).toBe(200);
  const body = response.json<Envelope<{ sessionToken: string }>>();
  expect(body.data?.sessionToken).toMatch(/^synthetic-session-/u);
  return body.data!.sessionToken;
}
