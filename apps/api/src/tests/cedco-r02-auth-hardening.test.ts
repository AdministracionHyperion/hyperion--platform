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
  it("serves a product-ready login page with password-manager friendly fields", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/v1/auth/login",
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers["content-type"]).toContain("text/html");
    expect(response.body).toContain("Acceso al panel operativo");
    expect(response.body).toContain("Centro operativo");
    expect(response.body).toContain('name="username"');
    expect(response.body).toContain('autocomplete="username"');
    expect(response.body).toContain('name="password"');
    expect(response.body).toContain('type="password"');
    expect(response.body).toContain('autocomplete="current-password"');
    expect(response.body).toContain("navigator.credentials.store");
    expect(response.body).not.toMatch(/Hyperion R02|Twilio|ElevenLabs|Google|11labs/iu);
  });

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
    expect(dashboard.body).toContain("Centro operativo CEDCO");
  });

  it("denies viewer writes with DB-backed-role semantics", async () => {
    const sessionToken = await login("reports-viewer");
    const dashboard = await app.inject({
      method: "GET",
      url: `${baseUrl}/dashboard`,
      headers: { authorization: `Bearer ${sessionToken}` },
    });
    expect(dashboard.statusCode).toBe(200);
    expect(dashboard.body).toContain("Consulta y reportes");
    expect(dashboard.body).not.toMatch(/Auditoria|Auditoría|Restringido/iu);
    expect(dashboard.body).not.toContain('data-r02-action="availability"');
    expect(dashboard.body).not.toContain('data-r02-action="appointment"');
    expect(dashboard.body).not.toContain('data-r02-action="upload-knowledge"');

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

  it("records failed login as a controlled auth failure", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: {
        tenantId,
        loginRef: "cedco-admin",
        credential: "short",
      },
    });
    expect(response.statusCode).toBe(400);
    expect(response.json<Envelope>().error?.code).toBe("validation_error");
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
