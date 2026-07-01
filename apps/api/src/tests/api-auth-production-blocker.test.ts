import { describe, expect, it } from "vitest";
import { loadApiConfig } from "../config/api-config";

const syntheticDatabaseUrl = [
  "postgresql",
  "://hyperion_test:hyperion_test@localhost:5432/hyperion_test?schema=public",
].join("");

describe("API auth production blocker", () => {
  it("rejects header-dev auth in production", () => {
    expect(() =>
      loadApiConfig({
        NODE_ENV: "production",
        API_SERVICES_MODE: "prisma",
        DATABASE_URL: syntheticDatabaseUrl,
        AUTH_MODE: "header-dev",
      } as NodeJS.ProcessEnv),
    ).toThrow("AUTH_MODE=header-dev is not allowed in production");
  });

  it("rejects missing auth mode in production", () => {
    expect(() =>
      loadApiConfig({
        NODE_ENV: "production",
        API_SERVICES_MODE: "prisma",
        DATABASE_URL: syntheticDatabaseUrl,
      } as NodeJS.ProcessEnv),
    ).toThrow("AUTH_MODE=local-staging or AUTH_MODE=jwt-required is required in production");
  });

  it("allows header-dev auth in test mode only with explicit flag", () => {
    const config = loadApiConfig({
      NODE_ENV: "test",
      AUTH_MODE: "header-dev",
      ALLOW_HEADER_DEV_AUTH: "true",
    } as NodeJS.ProcessEnv);

    expect(config.authMode).toBe("header-dev");
  });

  it("rejects header-dev auth without explicit flag", () => {
    expect(() =>
      loadApiConfig({
        NODE_ENV: "test",
        AUTH_MODE: "header-dev",
      } as NodeJS.ProcessEnv),
    ).toThrow("AUTH_MODE=header-dev requires ALLOW_HEADER_DEV_AUTH=true");
  });

  it("uses local-staging auth by default outside explicit local dev headers", () => {
    const config = loadApiConfig({
      NODE_ENV: "test",
      API_SERVICES_MODE: "fake",
    } as NodeJS.ProcessEnv);

    expect(config.authMode).toBe("local-staging");
  });

  it("rejects jwt-required without a JWT verifier reference", () => {
    expect(() =>
      loadApiConfig({
        NODE_ENV: "test",
        AUTH_MODE: "jwt-required",
      } as NodeJS.ProcessEnv),
    ).toThrow("AUTH_JWKS_URL or AUTH_JWT_PUBLIC_KEY_REF is required");
  });
});
