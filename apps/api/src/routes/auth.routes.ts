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
  <title>Acceso CEDCO</title>
  <style>
    :root{color-scheme:light;--ink:#16202a;--muted:#5f6b7a;--line:#d7dee8;--panel:#ffffff;--canvas:#eef2f6;--accent:#0b5cad;--accent-strong:#084a8c;--ok:#0f766e;--warn:#8a4b0b}
    *{box-sizing:border-box}
    body{font-family:Inter,ui-sans-serif,system-ui,-apple-system,Segoe UI,sans-serif;margin:0;min-height:100vh;background:linear-gradient(135deg,#eef2f6 0%,#f8fafc 52%,#e7edf4 100%);color:var(--ink)}
    body::before{content:"";position:fixed;inset:0;background:radial-gradient(circle at 18% 12%,rgba(11,92,173,.12),transparent 30%),radial-gradient(circle at 82% 22%,rgba(15,118,110,.10),transparent 28%);pointer-events:none}
    main{position:relative;display:grid;grid-template-columns:minmax(320px,1fr) minmax(340px,440px);gap:28px;align-items:stretch;width:min(1080px,calc(100% - 32px));margin:8vh auto}
    .intro,.card{background:rgba(255,255,255,.92);border:1px solid rgba(215,222,232,.95);box-shadow:0 18px 54px rgba(22,32,42,.12)}
    .intro{padding:38px;border-radius:10px;display:flex;flex-direction:column;justify-content:space-between;min-height:520px}
    .brand{display:flex;align-items:center;gap:14px;margin-bottom:34px}
    .mark{display:grid;place-items:center;width:46px;height:46px;border-radius:8px;background:#0b5cad;color:white;font-weight:800;letter-spacing:.02em}
    .brand strong{display:block;font-size:18px;line-height:1.1}.brand span{display:block;color:var(--muted);font-size:13px;margin-top:4px}
    h1{font-size:clamp(34px,5vw,58px);line-height:.98;margin:0 0 18px;letter-spacing:0}
    .lead{max-width:560px;color:#394656;font-size:18px;line-height:1.55;margin:0}
    .status-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:40px}
    .status{border:1px solid var(--line);border-radius:8px;padding:12px;background:#f8fafc}.status small{display:block;color:var(--muted);font-size:12px}.status strong{display:block;margin-top:5px;font-size:14px}
    .card{border-radius:10px;padding:30px;align-self:center}
    .card h2{margin:0;font-size:24px}.subtitle{margin:8px 0 26px;color:var(--muted);line-height:1.45}
    form{display:grid;gap:16px}
    label{display:grid;gap:7px;font-size:13px;font-weight:700;color:#2d3845}
    input{width:100%;padding:13px 14px;border:1px solid #b9c4d2;border-radius:7px;background:#fff;color:var(--ink);font:inherit;outline:none}
    input:focus{border-color:var(--accent);box-shadow:0 0 0 3px rgba(11,92,173,.15)}
    button{margin-top:4px;width:100%;padding:13px 16px;border:0;border-radius:7px;background:var(--accent);color:white;font-weight:800;font:inherit;cursor:pointer}
    button:hover{background:var(--accent-strong)}button:disabled{background:#8aa8c8;cursor:wait}
    .help{border:1px solid #d7e6f7;background:#f4f8fd;border-radius:8px;padding:12px 14px;color:#37506b;font-size:13px;line-height:1.45}
    .error{min-height:20px;margin:0;color:#9a3412;font-weight:700;font-size:13px}
    .footer-note{margin-top:18px;color:var(--muted);font-size:12px;line-height:1.45}
    @media (max-width:820px){main{grid-template-columns:1fr;margin:18px auto}.intro{min-height:auto;padding:26px}.status-grid{grid-template-columns:1fr}.card{padding:24px}h1{font-size:36px}}
  </style>
</head>
<body>
  <main>
    <section class="intro" aria-labelledby="login-title">
      <div>
        <div class="brand" aria-label="CEDCO">
          <div class="mark">C</div>
          <div><strong>CEDCO</strong><span>Centro operativo</span></div>
        </div>
        <h1 id="login-title">Acceso al panel operativo</h1>
        <p class="lead">Gestiona agenda, conocimiento, asistentes, derivaciones y auditoria desde un espacio privado para el equipo autorizado.</p>
      </div>
      <div class="status-grid" aria-label="Estado del acceso">
        <div class="status"><small>Ambiente</small><strong>Staging operativo</strong></div>
        <div class="status"><small>Acceso</small><strong>Roles autorizados</strong></div>
        <div class="status"><small>Actividad</small><strong>Auditada</strong></div>
      </div>
    </section>
    <section class="card" aria-label="Inicio de sesion">
      <h2>Iniciar sesion</h2>
      <p class="subtitle">Usa el usuario asignado y tu credencial temporal para entrar al panel operativo.</p>
      <form id="login" method="post" action="/api/v1/auth/login" autocomplete="on">
        <input id="tenantId" name="tenantId" type="hidden" value="cedco-demo" autocomplete="organization" />
        <label for="username">Usuario
          <input id="username" name="username" autocomplete="username" autocapitalize="none" spellcheck="false" inputmode="email" required />
        </label>
        <label for="password">Credencial
          <input id="password" name="password" type="password" autocomplete="current-password" required />
        </label>
        <button id="submit" type="submit">Entrar al panel</button>
        <p id="error" class="error" role="alert" aria-live="polite"></p>
      </form>
      <div class="help">Por seguridad, las credenciales no se muestran en esta pantalla. Si tu credencial temporal vence, solicita una nueva al administrador.</div>
      <p class="footer-note">Este acceso no conecta proveedores externos ni ejecuta llamadas. Solo abre el panel operativo autorizado.</p>
    </section>
  </main>
  <script>
    const form = document.getElementById("login");
    const button = document.getElementById("submit");
    const error = document.getElementById("error");
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      error.textContent = "";
      button.disabled = true;
      const formData = new FormData(event.currentTarget);
      const tenantId = String(formData.get("tenantId") || "cedco-demo");
      const username = String(formData.get("username") || "").trim();
      const credentialValue = String(formData.get("password") || "");
      try {
        const response = await fetch("/api/v1/auth/login", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ tenantId, loginRef: username, credential: credentialValue })
        });
        if (!response.ok) {
          error.textContent = "Usuario o credencial no validos.";
          return;
        }
        try {
          if ("credentials" in navigator && "PasswordCredential" in window) {
            await navigator.credentials.store(new PasswordCredential(form));
          }
        } catch (_ignored) {
          // Password managers can still detect the standard username/password fields.
        }
        window.location.assign("/api/v1/tenants/" + encodeURIComponent(tenantId) + "/r02/dashboard");
      } catch (_error) {
        error.textContent = "No fue posible iniciar sesion. Intenta de nuevo.";
      } finally {
        button.disabled = false;
      }
    });
  </script>
</body>
</html>`;
}
