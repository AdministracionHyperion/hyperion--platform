import type { FastifyInstance } from "fastify";
import { authWhoamiQuerySchema, localAuthLoginBodySchema } from "../contracts";
import { missingActorError, runtimeActionBlockedError } from "../http/api-error";
import { ok } from "../http/api-response";
import { getHeaderValue } from "../http/request-context";
import type { RouteRegistryDependencies } from "../http/route-registry";
import { validateWithSchema } from "../http/validation";

export async function registerAuthRoutes(
  app: FastifyInstance,
  dependencies: RouteRegistryDependencies,
): Promise<void> {
  app.get("/api/v1/auth/login", async (_request, reply) => {
    reply.type("text/html; charset=utf-8");
    return renderLoginPage();
  });

  app.post("/api/v1/auth/login", async (request, reply) => {
    const body = validateWithSchema(localAuthLoginBodySchema, request.body);
    const auth = requireAuthService(dependencies);
    const result = await auth.login({
      tenantId: body.tenantId,
      loginRef: body.loginRef,
      credential: body.credential,
      userAgent: getHeaderValue(request, "user-agent"),
    });
    reply.header("set-cookie", buildSessionCookie(result.sessionToken, isHttpsRequest(request)));
    return ok({
      sessionToken: result.sessionToken,
      principal: serializePrincipal(result.principal),
    });
  });

  app.get("/api/v1/auth/whoami", async (request) => {
    const query = validateWithSchema(authWhoamiQuerySchema, request.query);
    const auth = requireAuthService(dependencies);
    const sessionToken = extractSessionToken(request.headers);
    if (!sessionToken) {
      throw missingActorError("Local staging session is required.");
    }
    const principal = await auth.resolveSession(sessionToken, query.tenantId);
    if (!principal) {
      throw missingActorError("Local staging session is invalid or expired.");
    }
    return ok({ principal: serializePrincipal(principal) });
  });

  app.post("/api/v1/auth/logout", async (request, reply) => {
    const auth = requireAuthService(dependencies);
    const sessionToken = extractSessionToken(request.headers);
    if (!sessionToken) {
      throw missingActorError("Local staging session is required.");
    }
    const result = await auth.logout(sessionToken);
    reply.header("set-cookie", expireSessionCookie(isHttpsRequest(request)));
    return ok(result);
  });
}

function requireAuthService(dependencies: RouteRegistryDependencies) {
  if (!dependencies.services.auth) {
    throw runtimeActionBlockedError("Local staging auth service is not configured.");
  }
  return dependencies.services.auth;
}

function serializePrincipal(principal: {
  readonly tenantId: string;
  readonly actorId: string;
  readonly displayName?: string;
  readonly roles: readonly string[];
  readonly loginRef: string;
  readonly resetRequired: boolean;
  readonly sessionId?: string;
  readonly expiresAt?: Date;
}) {
  return {
    tenantId: principal.tenantId,
    actorId: principal.actorId,
    ...(principal.displayName ? { displayName: principal.displayName } : {}),
    roles: principal.roles,
    loginRef: principal.loginRef,
    resetRequired: principal.resetRequired,
    ...(principal.sessionId ? { sessionId: principal.sessionId } : {}),
    ...(principal.expiresAt ? { expiresAt: principal.expiresAt.toISOString() } : {}),
  };
}

function buildSessionCookie(sessionToken: string, https: boolean): string {
  const secure = https ? "Secure" : "";
  return [
    `hyperion_session=${encodeURIComponent(sessionToken)}`,
    "HttpOnly",
    "SameSite=Lax",
    "Path=/",
    "Max-Age=28800",
    secure,
  ]
    .filter((part) => part.length > 0)
    .join("; ");
}

function expireSessionCookie(https: boolean): string {
  const secure = https ? "Secure" : "";
  return ["hyperion_session=", "HttpOnly", "SameSite=Lax", "Path=/", "Max-Age=0", secure]
    .filter((part) => part.length > 0)
    .join("; ");
}

function extractSessionToken(headers: Readonly<Record<string, unknown>>): string | undefined {
  const authorization = headerString(headers.authorization);
  if (authorization?.toLowerCase().startsWith("bearer ")) {
    const bearerValue = authorization.slice("bearer ".length).trim();
    return bearerValue.length > 0 ? bearerValue : undefined;
  }
  const cookie = headerString(headers.cookie);
  if (!cookie) return undefined;
  for (const part of cookie.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === "hyperion_session") {
      const value = rest.join("=").trim();
      return value.length > 0 ? decodeURIComponent(value) : undefined;
    }
  }
  return undefined;
}

function isHttpsRequest(request: { readonly headers: Readonly<Record<string, unknown>> }): boolean {
  return headerString(request.headers["x-forwarded-proto"]) === "https";
}

function headerString(value: unknown): string | undefined {
  if (Array.isArray(value)) {
    return typeof value[0] === "string" ? value[0] : undefined;
  }
  return typeof value === "string" ? value : undefined;
}

function renderLoginPage(): string {
  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Hyperion R02</title>
  <style>
    body{font-family:system-ui,-apple-system,Segoe UI,sans-serif;margin:0;background:#f6f7f9;color:#17202a}
    main{max-width:420px;margin:12vh auto;padding:32px;background:#fff;border:1px solid #d8dee6;border-radius:8px}
    label{display:block;font-size:13px;font-weight:600;margin:16px 0 6px}
    input{width:100%;box-sizing:border-box;padding:10px;border:1px solid #b7c0cc;border-radius:6px;font:inherit}
    button{margin-top:20px;width:100%;padding:10px;border:0;border-radius:6px;background:#1f6feb;color:white;font-weight:700}
    p{min-height:20px;color:#9a3412}
  </style>
</head>
<body>
  <main>
    <h1>Hyperion R02</h1>
    <form id="login">
      <label for="tenantId">Tenant</label>
      <input id="tenantId" name="tenantId" value="cedco-demo" autocomplete="organization" />
      <label for="loginRef">Usuario</label>
      <input id="loginRef" name="loginRef" autocomplete="username" />
      <label for="credential">Credencial</label>
      <input id="credential" name="credential" type="password" autocomplete="current-password" />
      <button type="submit">Entrar</button>
      <p id="error"></p>
    </form>
  </main>
  <script>
    document.getElementById("login").addEventListener("submit", async (event) => {
      event.preventDefault();
      const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
      const response = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        document.getElementById("error").textContent = "Acceso no autorizado.";
        return;
      }
      window.location.href = "/api/v1/tenants/" + encodeURIComponent(payload.tenantId) + "/r02/dashboard";
    });
  </script>
</body>
</html>`;
}
