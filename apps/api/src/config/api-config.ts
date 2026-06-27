import { z } from "zod";

export type ApiServicesMode = "fake" | "prisma";
export type ApiAuthMode = "header-dev" | "jwt-required";

const apiConfigSchema = z.object({
  API_HOST: z.string().default("127.0.0.1"),
  API_PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1).optional(),
  NODE_ENV: z.string().default("development"),
  API_SERVICES_MODE: z.enum(["fake", "prisma"]).optional(),
  AUTH_MODE: z.enum(["header-dev", "jwt-required"]).optional(),
  AUTH_JWKS_URL: z.string().min(1).optional(),
  AUTH_JWT_PUBLIC_KEY_REF: z.string().min(1).optional(),
  AUTH_PROVIDER_REF: z.string().min(1).optional(),
});

export interface ApiConfig {
  readonly host: string;
  readonly port: number;
  readonly databaseUrl?: string;
  readonly nodeEnv: string;
  readonly servicesMode: ApiServicesMode;
  readonly authMode: ApiAuthMode;
  readonly authReference?: {
    readonly jwksUrl?: string;
    readonly jwtPublicKeyRef?: string;
    readonly providerRef?: string;
  };
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
    hasAuthReference:
      parsed.AUTH_JWKS_URL !== undefined ||
      parsed.AUTH_JWT_PUBLIC_KEY_REF !== undefined ||
      parsed.AUTH_PROVIDER_REF !== undefined,
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
    throw new Error("AUTH_MODE=jwt-required is required in production.");
  }

  return "header-dev";
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
  readonly hasAuthReference: boolean;
  readonly explicitlyConfigured: boolean;
}): void {
  if (input.nodeEnv === "production" && !input.explicitlyConfigured) {
    throw new Error("AUTH_MODE=jwt-required is required in production.");
  }

  if (input.nodeEnv === "production" && input.authMode === "header-dev") {
    throw new Error("AUTH_MODE=header-dev is not allowed in production.");
  }

  if (input.authMode === "jwt-required" && !input.hasAuthReference) {
    throw new Error(
      "AUTH_JWKS_URL, AUTH_JWT_PUBLIC_KEY_REF, or AUTH_PROVIDER_REF is required when AUTH_MODE=jwt-required.",
    );
  }
}
