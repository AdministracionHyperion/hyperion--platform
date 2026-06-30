import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createApiApp } from "../app";
import { getApiIntegrationDatabaseUrl } from "./api-test-url";
import { createApiPrismaTestHarness, type ApiPrismaTestHarness } from "./api-prisma-test-harness";
import {
  createLocalCredentialSalt,
  hashLocalCredential,
} from "../services/local-staging-auth-service";

interface Envelope<T = Record<string, unknown>> {
  readonly ok: boolean;
  readonly data?: T;
  readonly error?: { readonly code: string };
}

const databaseUrl = getApiIntegrationDatabaseUrl();
const runWhenDatabaseExists = databaseUrl ? describe : describe.skip;
const tenantId = "cedco-test";
const baseUrl = `/api/v1/tenants/${tenantId}/r02`;
const syntheticCredential = "valid-prisma-local-credential";

let harness: ApiPrismaTestHarness;
let app: FastifyInstance;

runWhenDatabaseExists("CEDCO R02 Prisma local staging auth", () => {
  beforeAll(async () => {
    harness = await createApiPrismaTestHarness(databaseUrl as string);
    app = await createApiApp({ services: harness.services, authMode: "local-staging" });
  }, 120_000);

  beforeEach(async () => {
    await harness.cleanup();
    await harness.seedBaseContext();
    await seedCredential("actor-test", "cedco-admin", ["cedco_admin"]);
    await seedCredential("viewer-test", "reports-viewer", ["reports_viewer"]);
  });

  afterAll(async () => {
    await app.close();
    await harness.disconnect();
  });

  it("uses Prisma credentials and sessions for protected R02 access", async () => {
    const sessionToken = await login("cedco-admin");
    const whoami = await app.inject({
      method: "GET",
      url: "/api/v1/auth/whoami",
      headers: { authorization: `Bearer ${sessionToken}` },
    });
    expect(whoami.statusCode).toBe(200);
    expect(
      whoami.json<Envelope<{ principal: { actorId: string; roles: string[] } }>>().data,
    ).toMatchObject({
      principal: {
        actorId: "actor-test",
        roles: ["cedco_admin"],
      },
    });

    const dashboard = await app.inject({
      method: "GET",
      url: `${baseUrl}/dashboard`,
      headers: { authorization: `Bearer ${sessionToken}` },
    });
    expect(dashboard.statusCode).toBe(200);
    await app.inject({
      method: "POST",
      url: "/api/v1/auth/logout",
      headers: { authorization: `Bearer ${sessionToken}` },
    });
    expect(await harness.prisma.localAuthSession.count()).toBe(1);
    expect(await harness.prisma.auditLog.count({ where: { action: "auth.login.success" } })).toBe(
      1,
    );
    expect(await harness.prisma.auditLog.count({ where: { action: "auth.logout.success" } })).toBe(
      1,
    );
  });

  it("applies viewer RBAC from Prisma membership roles", async () => {
    const sessionToken = await login("reports-viewer");
    const denied = await app.inject({
      method: "POST",
      url: `${baseUrl}/calendar/availability`,
      headers: { authorization: `Bearer ${sessionToken}` },
      payload: {
        slotId: "slot-r02-auth-prisma-denied",
        resourceId: "cedco-r02-recepcion",
        siteId: "cedco-main-site",
        serviceTypeId: "consulta-general",
        startsAt: "2026-07-12T14:00:00.000Z",
        endsAt: "2026-07-12T14:30:00.000Z",
        capacity: 1,
      },
    });
    expect(denied.statusCode).toBe(403);
  });
});

async function login(loginRef: string): Promise<string> {
  const response = await app.inject({
    method: "POST",
    url: "/api/v1/auth/login",
    payload: { tenantId, loginRef, credential: syntheticCredential },
  });
  expect(response.statusCode).toBe(200);
  return response.json<Envelope<{ sessionToken: string }>>().data!.sessionToken;
}

async function seedCredential(userId: string, loginRef: string, roles: string[]): Promise<void> {
  await harness.prisma.user.upsert({
    where: { id: userId },
    create: { id: userId, displayName: loginRef, status: "active", metadata: {} },
    update: { status: "active" },
  });
  await harness.prisma.tenantMembership.upsert({
    where: { tenantId_userId: { tenantId, userId } },
    create: {
      id: `membership-${tenantId}-${userId}`,
      tenantId,
      userId,
      roles,
      status: "active",
    },
    update: { roles, status: "active" },
  });
  const salt = createLocalCredentialSalt();
  await harness.prisma.localAuthCredential.upsert({
    where: { tenantId_loginRef: { tenantId, loginRef } },
    create: {
      id: `local-auth-${tenantId}-${userId}`,
      tenantId,
      userId,
      loginRef,
      credentialHash: await hashLocalCredential(syntheticCredential, salt),
      credentialSalt: salt,
      kdf: "scrypt",
      status: "active",
      resetRequired: true,
      metadata: {},
    },
    update: {
      credentialHash: await hashLocalCredential(syntheticCredential, salt),
      credentialSalt: salt,
      kdf: "scrypt",
      status: "active",
      resetRequired: true,
      metadata: {},
    },
  });
}
