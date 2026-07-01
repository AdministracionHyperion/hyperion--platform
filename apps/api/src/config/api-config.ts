import { z } from "zod";

export type ApiServicesMode = "fake" | "prisma";
export type ApiAuthMode = "header-dev" | "local-staging" | "jwt-required";

export interface ApiAuthReference {
  readonly jwksUrl?: string;
  readonly jwtPublicKeyRef?: string;
  readonly providerRef?: string;
}

const apiConfigSchema = z.object({
  API_HOST: z.string().default("127.0.0.1"),
  API_PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1).optional(),
  NODE_ENV: z.string().default("development"),
  API_SERVICES_MODE: z.enum(["fake", "prisma"]).optional(),
  AUTH_MODE: z.enum(["header-dev", "local-staging", "jwt-required"]).optional(),
  ALLOW_HEADER_DEV_AUTH: z.enum(["true", "false"]).optional(),
  AUTH_JWKS_URL: z.string().min(1).optional(),
  AUTH_JWT_PUBLIC_KEY_REF: z.string().min(1).optional(),
  AUTH_PROVIDER_REF: z.string().min(1).optional(),
  INTERNAL_DIALER_BASE_URL: z.string().min(1).optional(),
});

export interface ApiConfig {
  readonly host: string;
  readonly port: number;
  readonly databaseUrl?: string;
  readonly nodeEnv: string;
  readonly servicesMode: ApiServicesMode;
  readonly authMode: ApiAuthMode;
  readonly authReference?: ApiAuthReference;
  readonly internalDialerBaseUrl?: string;
}

export function loadApiConfig(env: NodeJS.ProcessEnv = process.env): ApiConfig {
  const parsed = apiConfigSchema.parse(env);
  const nodeEnv = parsed.NODE_ENV;
  const servicesMode = resolveServicesMode(parsed);
  const authMode = resolveAuthMode(parsed);

  validateServicesMode({
    nodeEnv,
    servicesMode,
    databaseUrl: parsed.DATABASE_URL,
    explicitlyConfigured: parsed.API_SERVICES_MODE !== undefined,
  });
  validateAuthMode({
    nodeEnv,
    authMode,
    allowHeaderDevAuth: parsed.ALLOW_HEADER_DEV_AUTH === "true",
    hasJwtVerifierReference:
      parsed.AUTH_JWKS_URL !== undefined || parsed.AUTH_JWT_PUBLIC_KEY_REF !== undefined,
    explicitlyConfigured: parsed.AUTH_MODE !== undefined,
  });

  return {
    host: parsed.API_HOST,
    port: parsed.API_PORT,
    ...(parsed.DATABASE_URL ? { databaseUrl: parsed.DATABASE_URL } : {}),
    nodeEnv,
    servicesMode,
    authMode,
    ...(parsed.AUTH_JWKS_URL || parsed.AUTH_JWT_PUBLIC_KEY_REF || parsed.AUTH_PROVIDER_REF
      ? {
          authReference: {
            ...(parsed.AUTH_JWKS_URL ? { jwksUrl: parsed.AUTH_JWKS_URL } : {}),
            ...(parsed.AUTH_JWT_PUBLIC_KEY_REF
              ? { jwtPublicKeyRef: parsed.AUTH_JWT_PUBLIC_KEY_REF }
              : {}),
            ...(parsed.AUTH_PROVIDER_REF ? { providerRef: parsed.AUTH_PROVIDER_REF } : {}),
          },
        }
      : {}),
    ...(parsed.INTERNAL_DIALER_BASE_URL
      ? { internalDialerBaseUrl: parsed.INTERNAL_DIALER_BASE_URL }
      : {}),
  };
}

function resolveServicesMode(parsed: z.infer<typeof apiConfigSchema>): ApiServicesMode {
  if (parsed.API_SERVICES_MODE) {
    return parsed.API_SERVICES_MODE;
  }

  if (parsed.NODE_ENV === "test") {
    return "fake";
  }

  if (parsed.DATABASE_URL) {
    throw new Error("API_SERVICES_MODE must be explicit when DATABASE_URL is configured.");
  }

  return "fake";
}

function resolveAuthMode(parsed: z.infer<typeof apiConfigSchema>): ApiAuthMode {
  if (parsed.AUTH_MODE) {
    return parsed.AUTH_MODE;
  }

  if (parsed.NODE_ENV === "production") {
    throw new Error("AUTH_MODE=local-staging or AUTH_MODE=jwt-required is required in production.");
  }

  if (parsed.ALLOW_HEADER_DEV_AUTH === "true") {
    return "header-dev";
  }

  return "local-staging";
}

function validateServicesMode(input: {
  readonly nodeEnv: string;
  readonly servicesMode: ApiServicesMode;
  readonly databaseUrl?: string;
  readonly explicitlyConfigured: boolean;
}): void {
  if (input.nodeEnv === "production" && !input.explicitlyConfigured) {
    throw new Error("API_SERVICES_MODE=prisma is required in production.");
  }

  if (input.nodeEnv === "production" && input.servicesMode === "fake") {
    throw new Error("API_SERVICES_MODE=fake is not allowed in production.");
  }

  if (input.servicesMode === "prisma" && !input.databaseUrl) {
    throw new Error("DATABASE_URL is required when API_SERVICES_MODE=prisma.");
  }
}

function validateAuthMode(input: {
  readonly nodeEnv: string;
  readonly authMode: ApiAuthMode;
  readonly allowHeaderDevAuth: boolean;
  readonly hasJwtVerifierReference: boolean;
  readonly explicitlyConfigured: boolean;
}): void {
  if (input.nodeEnv === "production" && !input.explicitlyConfigured) {
    throw new Error("AUTH_MODE=local-staging or AUTH_MODE=jwt-required is required in production.");
  }

  if (input.nodeEnv === "production" && input.authMode === "header-dev") {
    throw new Error("AUTH_MODE=header-dev is not allowed in production.");
  }

  if (input.authMode === "header-dev" && !input.allowHeaderDevAuth) {
    throw new Error("AUTH_MODE=header-dev requires ALLOW_HEADER_DEV_AUTH=true.");
  }

  if (input.authMode === "header-dev" && !["development", "test"].includes(input.nodeEnv)) {
    throw new Error("AUTH_MODE=header-dev is allowed only in local development or tests.");
  }

  if (input.authMode === "jwt-required" && !input.hasJwtVerifierReference) {
    throw new Error(
      "AUTH_JWKS_URL or AUTH_JWT_PUBLIC_KEY_REF is required when AUTH_MODE=jwt-required.",
    );
  }
}
