import { createSign, generateKeyPairSync, type KeyObject } from "node:crypto";
import { describe, expect, it } from "vitest";
import { createApiApp } from "../app";
import { createApiServicesFromConfig } from "../composition";
import { loadApiConfig } from "../config/api-config";

const syntheticDatabaseUrl = [
  "postgresql",
  "://hyperion_test:hyperion_test@localhost:5432/hyperion_test?schema=public",
].join("");

describe("API runtime composition", () => {
  it("rejects production fake services", () => {
    expect(() =>
      loadApiConfig({
        NODE_ENV: "production",
        API_SERVICES_MODE: "fake",
        AUTH_MODE: "jwt-required",
        AUTH_PROVIDER_REF: "auth-provider-ref",
      } as NodeJS.ProcessEnv),
    ).toThrow("API_SERVICES_MODE=fake is not allowed in production");
  });

  it("rejects production prisma mode without DATABASE_URL", () => {
    expect(() =>
      loadApiConfig({
        NODE_ENV: "production",
        API_SERVICES_MODE: "prisma",
        AUTH_MODE: "jwt-required",
        AUTH_PROVIDER_REF: "auth-provider-ref",
      } as NodeJS.ProcessEnv),
    ).toThrow("DATABASE_URL is required");
  });

  it("configures prisma services for production with explicit DATABASE_URL and auth reference", async () => {
    const config = loadApiConfig({
      NODE_ENV: "production",
      API_SERVICES_MODE: "prisma",
      DATABASE_URL: syntheticDatabaseUrl,
      AUTH_MODE: "jwt-required",
      AUTH_JWT_PUBLIC_KEY_REF: "placeholder-public-key-ref",
    } as NodeJS.ProcessEnv);
    const runtime = createApiServicesFromConfig(config);

    expect(runtime.mode).toBe("prisma");
    expect(runtime.services).toBeDefined();
    await runtime.close();
  });

  it("allows fake services in test mode", () => {
    const config = loadApiConfig({
      NODE_ENV: "test",
      API_SERVICES_MODE: "fake",
    } as NodeJS.ProcessEnv);
    const runtime = createApiServicesFromConfig(config);

    expect(runtime.mode).toBe("fake");
  });

  it("loads staging internal dialer base URL without provider keys", () => {
    const config = loadApiConfig({
      NODE_ENV: "staging",
      API_SERVICES_MODE: "fake",
      INTERNAL_DIALER_BASE_URL: "http://hyperion-staging-dialer-api:8080",
    } as NodeJS.ProcessEnv);
    const runtime = createApiServicesFromConfig(config);

    expect(config.internalDialerBaseUrl).toBe("http://hyperion-staging-dialer-api:8080");
    expect(runtime.mode).toBe("fake");
  });

  it("rejects missing API_SERVICES_MODE in production", () => {
    expect(() =>
      loadApiConfig({
        NODE_ENV: "production",
        AUTH_MODE: "jwt-required",
        AUTH_PROVIDER_REF: "auth-provider-ref",
      } as NodeJS.ProcessEnv),
    ).toThrow("API_SERVICES_MODE=prisma is required in production");
  });

  it("rejects DATABASE_URL with implicit services mode outside tests", () => {
    expect(() =>
      loadApiConfig({
        NODE_ENV: "development",
        DATABASE_URL: syntheticDatabaseUrl,
      } as NodeJS.ProcessEnv),
    ).toThrow("API_SERVICES_MODE must be explicit");
  });

  it("does not require provider keys", () => {
    const config = loadApiConfig({
      NODE_ENV: "test",
      API_SERVICES_MODE: "fake",
      AUTH_MODE: "header-dev",
      ALLOW_HEADER_DEV_AUTH: "true",
    } as NodeJS.ProcessEnv);

    expect(config.servicesMode).toBe("fake");
  });

  it("blocks protected header auth routes when jwt-required mode is configured", async () => {
    const app = await createApiApp({ authMode: "jwt-required" });
    const response = await app.inject({
      method: "GET",
      url: "/api/v1/tenants/cedco-test/context",
      headers: {
        "x-actor-id": "actor-test",
        "x-actor-roles": "tenant-admin",
      },
    });

    expect(response.statusCode).toBe(403);
    expect(JSON.stringify(response.json())).not.toContain("stack");
    await app.close();
  });

  it("accepts a valid RS256 JWT in jwt-required mode", async () => {
    const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
    const bearerJwt = signJwt(privateKey, {
      sub: "actor-jwt",
      tenant_id: "cedco-test",
      roles: ["tenant-admin"],
      exp: Math.floor(Date.now() / 1000) + 300,
    });
    const app = await createApiApp({
      authMode: "jwt-required",
      authReference: {
        jwtPublicKeyRef: publicKey.export({ type: "spki", format: "pem" }).toString(),
      },
    });

    const response = await app.inject({
      method: "GET",
      url: "/api/v1/tenants/cedco-test/context",
      headers: {
        authorization: `Bearer ${bearerJwt}`,
        "x-correlation-id": "corr-jwt-test",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      data: {
        tenantId: "cedco-test",
        actorId: "actor-jwt",
        roles: ["tenant-admin"],
      },
      meta: { correlationId: "corr-jwt-test", tenantId: "cedco-test" },
    });
    await app.close();
  });

  it("rejects a JWT whose tenant claim does not match the route", async () => {
    const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
    const bearerJwt = signJwt(privateKey, {
      sub: "actor-jwt",
      tenant_id: "other-tenant",
      roles: ["tenant-admin"],
      exp: Math.floor(Date.now() / 1000) + 300,
    });
    const app = await createApiApp({
      authMode: "jwt-required",
      authReference: {
        jwtPublicKeyRef: publicKey.export({ type: "spki", format: "pem" }).toString(),
      },
    });

    const response = await app.inject({
      method: "GET",
      url: "/api/v1/tenants/cedco-test/context",
      headers: { authorization: `Bearer ${bearerJwt}` },
    });

    expect(response.statusCode).toBe(403);
    expect(response.json()).toMatchObject({ error: { code: "forbidden" } });
    await app.close();
  });
});

function signJwt(privateKey: KeyObject, payload: Record<string, unknown>): string {
  const header = { alg: "RS256", typ: "JWT" };
  const signingInput = `${encodeBase64Url(JSON.stringify(header))}.${encodeBase64Url(
    JSON.stringify(payload),
  )}`;
  const signer = createSign("RSA-SHA256");
  signer.update(signingInput);
  signer.end();
  return `${signingInput}.${encodeBase64Url(signer.sign(privateKey))}`;
}

function encodeBase64Url(value: string | Buffer): string {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/gu, "-")
    .replace(/\//gu, "_")
    .replace(/=+$/u, "");
}
