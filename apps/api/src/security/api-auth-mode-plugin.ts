import { createPublicKey, createVerify, type KeyObject } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import type { FastifyInstance } from "fastify";
import type { ApiAuthMode, ApiAuthReference } from "../config/api-config";
import { forbiddenError, missingActorError, runtimeActionBlockedError } from "../http/api-error";
import type { ApiAuthServices } from "../services";

const publicRoutes = new Set([
  "/health",
  "/api/v1/version",
  "/api/v1/auth/login",
  "/api/v1/auth/whoami",
  "/api/v1/auth/logout",
]);

export async function registerApiAuthModePlugin(
  app: FastifyInstance,
  authMode: ApiAuthMode,
  auth?: ApiAuthServices,
  authReference?: ApiAuthReference,
): Promise<void> {
  app.addHook("preHandler", async (request) => {
    const routePath = request.routeOptions.url ?? request.url.split("?")[0] ?? request.url;
    if (publicRoutes.has(routePath)) {
      return;
    }

    if (authMode === "header-dev") {
      return;
    }

    if (authMode === "jwt-required") {
      const tenantId = extractTenantId(request.url);
      if (!tenantId) {
        throw missingActorError("Tenant-scoped JWT is required.");
      }
      const principal = await resolveJwtPrincipal(request.headers, tenantId, authReference);
      request.headers["x-actor-id"] = principal.actorId;
      request.headers["x-actor-roles"] = principal.roles.join(",");
      request.headers["x-request-source"] = "jwt";
      return;
    }

    if (!auth) {
      throw runtimeActionBlockedError("Local staging auth service is not configured.", {
        authMode,
      });
    }

    const tenantId = extractTenantId(request.url);
    if (!tenantId) {
      throw missingActorError("Tenant-scoped local staging session is required.");
    }
    const sessionToken = extractSessionToken(request.headers);
    if (!sessionToken) {
      throw missingActorError("Local staging session is required.");
    }
    const principal = await auth.resolveSession(sessionToken, tenantId);
    if (!principal) {
      throw missingActorError("Local staging session is invalid or expired.");
    }

    request.headers["x-actor-id"] = principal.actorId;
    request.headers["x-actor-roles"] = principal.roles.join(",");
    request.headers["x-request-source"] = "local-staging-auth";
  });
}

function extractTenantId(url: string): string | undefined {
  const match = /^\/api\/v1\/tenants\/([^/]+)/u.exec(url);
  return match ? decodeURIComponent(match[1]!) : undefined;
}

function extractSessionToken(headers: Readonly<Record<string, unknown>>): string | undefined {
  const authorization = headerString(headers.authorization);
  if (authorization?.toLowerCase().startsWith("bearer ")) {
    const bearerValue = authorization.slice("bearer ".length).trim();
    return bearerValue.length > 0 ? bearerValue : undefined;
  }

  const cookie = headerString(headers.cookie);
  if (!cookie) {
    return undefined;
  }
  for (const part of cookie.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === "hyperion_session") {
      const value = rest.join("=").trim();
      return value.length > 0 ? decodeURIComponent(value) : undefined;
    }
  }
  return undefined;
}

function headerString(value: unknown): string | undefined {
  if (Array.isArray(value)) {
    return typeof value[0] === "string" ? value[0] : undefined;
  }
  return typeof value === "string" ? value : undefined;
}

interface JwtHeader {
  readonly alg?: string;
  readonly kid?: string;
}

interface JwtPayload {
  readonly sub?: unknown;
  readonly actor_id?: unknown;
  readonly actorId?: unknown;
  readonly tenant_id?: unknown;
  readonly tenantId?: unknown;
  readonly tid?: unknown;
  readonly roles?: unknown;
  readonly role?: unknown;
  readonly realm_access?: { readonly roles?: unknown };
  readonly exp?: unknown;
  readonly nbf?: unknown;
}

interface DecodedJwt {
  readonly header: JwtHeader;
  readonly payload: JwtPayload;
  readonly signingInput: string;
  readonly signature: Buffer;
}

interface JwtPrincipal {
  readonly actorId: string;
  readonly roles: string[];
}

type JsonWebKeyLike = Record<string, unknown>;

const jwksCache = new Map<
  string,
  { readonly expiresAt: number; readonly keys: JsonWebKeyLike[] }
>();

async function resolveJwtPrincipal(
  headers: Readonly<Record<string, unknown>>,
  tenantId: string,
  authReference?: ApiAuthReference,
): Promise<JwtPrincipal> {
  if (!authReference?.jwksUrl && !authReference?.jwtPublicKeyRef) {
    throw runtimeActionBlockedError("JWT verifier reference is not configured.", {
      authMode: "jwt-required",
    });
  }

  const bearerJwt = extractBearerJwt(headers);
  if (!bearerJwt) {
    throw missingActorError("Bearer JWT is required.");
  }

  const decoded = decodeJwt(bearerJwt);
  assertJwtTiming(decoded.payload);
  const verified = await verifyJwtSignature(decoded, authReference);
  if (!verified) {
    throw missingActorError("Bearer JWT is invalid.");
  }

  const tokenTenant = extractTenantClaim(decoded.payload);
  if (!tokenTenant) {
    throw missingActorError("JWT tenant claim is required.");
  }
  if (tokenTenant !== tenantId) {
    throw forbiddenError("JWT tenant does not match request tenant.");
  }

  const actorId =
    claimString(decoded.payload.sub) ??
    claimString(decoded.payload.actor_id) ??
    claimString(decoded.payload.actorId);
  if (!actorId) {
    throw missingActorError("JWT subject is required.");
  }

  const roles = extractJwtRoles(decoded.payload);
  if (roles.length === 0) {
    throw missingActorError("JWT roles are required.");
  }

  return { actorId, roles };
}

function extractBearerJwt(headers: Readonly<Record<string, unknown>>): string | undefined {
  const authorization = headerString(headers.authorization);
  if (!authorization?.toLowerCase().startsWith("bearer ")) {
    return undefined;
  }
  const bearerJwt = authorization.slice("bearer ".length).trim();
  return bearerJwt.length > 0 ? bearerJwt : undefined;
}

function decodeJwt(compactJwt: string): DecodedJwt {
  const parts = compactJwt.split(".");
  if (parts.length !== 3 || parts.some((part) => part.length === 0)) {
    throw missingActorError("Bearer JWT is malformed.");
  }

  try {
    return {
      header: JSON.parse(base64UrlDecode(parts[0]!).toString("utf8")) as JwtHeader,
      payload: JSON.parse(base64UrlDecode(parts[1]!).toString("utf8")) as JwtPayload,
      signingInput: `${parts[0]}.${parts[1]}`,
      signature: base64UrlDecode(parts[2]!),
    };
  } catch {
    throw missingActorError("Bearer JWT is malformed.");
  }
}

function assertJwtTiming(payload: JwtPayload): void {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const exp = claimNumber(payload.exp);
  if (exp !== undefined && exp <= nowSeconds) {
    throw missingActorError("Bearer JWT is expired.");
  }

  const nbf = claimNumber(payload.nbf);
  if (nbf !== undefined && nbf > nowSeconds + 30) {
    throw missingActorError("Bearer JWT is not active yet.");
  }
}

async function verifyJwtSignature(
  decoded: DecodedJwt,
  authReference: ApiAuthReference,
): Promise<boolean> {
  if (decoded.header.alg !== "RS256") {
    throw missingActorError("JWT alg is not supported.");
  }

  if (authReference.jwtPublicKeyRef) {
    const publicKey = resolvePublicKey(authReference.jwtPublicKeyRef);
    return verifyRs256(decoded.signingInput, decoded.signature, publicKey);
  }

  if (authReference.jwksUrl) {
    const jwk = await resolveJwksKey(authReference.jwksUrl, decoded.header);
    const publicKey = createPublicKey({
      key: jwk,
      format: "jwk",
    } as Parameters<typeof createPublicKey>[0]);
    return verifyRs256(decoded.signingInput, decoded.signature, publicKey);
  }

  return false;
}

function resolvePublicKey(ref: string): string | KeyObject {
  if (ref.startsWith("file:")) {
    return readFileSync(ref.slice("file:".length), "utf8");
  }

  if (
    ref.includes("BEGIN PUBLIC KEY") ||
    ref.includes("BEGIN RSA PUBLIC KEY") ||
    ref.includes("BEGIN CERTIFICATE")
  ) {
    return ref;
  }

  if (existsSync(ref)) {
    return readFileSync(ref, "utf8");
  }

  try {
    return createPublicKey(ref);
  } catch {
    throw runtimeActionBlockedError("JWT public key reference is not readable.");
  }
}

async function resolveJwksKey(jwksUrl: string, header: JwtHeader): Promise<JsonWebKeyLike> {
  const now = Date.now();
  const cached = jwksCache.get(jwksUrl);
  const keys = cached && cached.expiresAt > now ? cached.keys : await fetchJwks(jwksUrl);
  const jwk = keys.find((key) => {
    const candidate = key as JsonWebKeyLike & { readonly kid?: string; readonly alg?: string };
    if (header.kid) {
      return candidate.kid === header.kid;
    }
    return !candidate.alg || candidate.alg === header.alg;
  });

  if (!jwk) {
    throw missingActorError("JWT signing key was not found.");
  }
  return jwk;
}

async function fetchJwks(jwksUrl: string): Promise<JsonWebKeyLike[]> {
  const response = await fetch(jwksUrl);
  if (!response.ok) {
    throw runtimeActionBlockedError("JWKS endpoint did not return a usable key set.");
  }
  const body = (await response.json()) as { readonly keys?: unknown };
  const keys = Array.isArray(body.keys) ? (body.keys as JsonWebKeyLike[]) : [];
  jwksCache.set(jwksUrl, { expiresAt: Date.now() + 5 * 60 * 1000, keys });
  return keys;
}

function verifyRs256(
  signingInput: string,
  signature: Buffer,
  publicKey: string | KeyObject,
): boolean {
  const verifier = createVerify("RSA-SHA256");
  verifier.update(signingInput);
  verifier.end();
  return verifier.verify(publicKey, signature);
}

function base64UrlDecode(value: string): Buffer {
  const normalized = value.replace(/-/gu, "+").replace(/_/gu, "/");
  const padding = "=".repeat((4 - (normalized.length % 4)) % 4);
  return Buffer.from(normalized + padding, "base64");
}

function claimString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function claimNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function extractTenantClaim(payload: JwtPayload): string | undefined {
  return (
    claimString(payload.tenant_id) ?? claimString(payload.tenantId) ?? claimString(payload.tid)
  );
}

function extractJwtRoles(payload: JwtPayload): string[] {
  const roles = [
    ...claimStringArray(payload.roles),
    ...claimStringArray(payload.role),
    ...claimStringArray(payload.realm_access?.roles),
  ];
  return [...new Set(roles)];
}

function claimStringArray(value: unknown): string[] {
  if (typeof value === "string") {
    return value
      .split(/[,\s]+/u)
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string" && item.length > 0);
  }
  return [];
}
