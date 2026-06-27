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
    ).toThrow("AUTH_MODE=jwt-required is required in production");
  });

  it("allows header-dev auth in test mode", () => {
    const config = loadApiConfig({
      NODE_ENV: "test",
      AUTH_MODE: "header-dev",
    } as NodeJS.ProcessEnv);

    expect(config.authMode).toBe("header-dev");
  });

  it("rejects jwt-required without a future auth reference", () => {
    expect(() =>
      loadApiConfig({
        NODE_ENV: "test",
        AUTH_MODE: "jwt-required",
      } as NodeJS.ProcessEnv),
    ).toThrow("AUTH_JWKS_URL, AUTH_JWT_PUBLIC_KEY_REF, or AUTH_PROVIDER_REF is required");
  });
});
