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
    :root{color-scheme:light;--ink:#111827;--muted:#5b6575;--soft:#eef3f7;--line:#d8e1ea;--panel:#ffffff;--canvas:#f6f8fb;--primary:#0a5f9f;--primary-strong:#084978;--teal:#0f766e;--amber:#b45309;--danger:#b42318;--ring:rgba(10,95,159,.22)}
    *{box-sizing:border-box}
    html{min-height:100%}
    body{font-family:Inter,ui-sans-serif,system-ui,-apple-system,Segoe UI,sans-serif;margin:0;min-height:100vh;background:linear-gradient(180deg,#eaf1f7 0%,#f6f8fb 42%,#ffffff 100%);color:var(--ink)}
    main{min-height:100vh;display:grid;grid-template-columns:minmax(0,1fr) minmax(360px,460px)}
    .workspace{display:flex;flex-direction:column;justify-content:space-between;padding:48px clamp(28px,6vw,84px);border-right:1px solid var(--line)}
    .brand{display:flex;align-items:center;gap:14px;margin-bottom:72px}
    .mark{display:grid;place-items:center;width:48px;height:48px;border-radius:8px;background:var(--ink);color:#fff;font-weight:850;font-size:22px}
    .brand strong{display:block;font-size:18px;line-height:1.1}.brand span{display:block;color:var(--muted);font-size:13px;margin-top:4px}
    .eyebrow{display:inline-flex;align-items:center;gap:8px;width:max-content;border:1px solid #b8d8d4;background:#effaf8;color:#075f59;border-radius:999px;padding:7px 11px;font-size:12px;font-weight:800;text-transform:uppercase}
    .eyebrow::before{content:"";width:8px;height:8px;border-radius:50%;background:var(--teal)}
    h1{max-width:680px;font-size:clamp(40px,5.8vw,74px);line-height:.96;margin:18px 0 20px;letter-spacing:0}
    .lead{max-width:640px;color:#334155;font-size:19px;line-height:1.58;margin:0}
    .ops-list{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:22px;margin-top:54px;max-width:760px}
    .ops-item{border-top:3px solid var(--primary);padding-top:14px}
    .ops-item:nth-child(2){border-color:var(--teal)}.ops-item:nth-child(3){border-color:var(--amber)}
    .ops-item small{display:block;color:var(--muted);font-size:12px;text-transform:uppercase;font-weight:800}.ops-item strong{display:block;margin-top:8px;font-size:15px}.ops-item span{display:block;margin-top:6px;color:#536173;font-size:13px;line-height:1.45}
    .session-note{max-width:720px;color:#526070;font-size:13px;line-height:1.5;margin-top:56px}
    .login-area{display:flex;align-items:center;justify-content:center;padding:36px;background:rgba(255,255,255,.78)}
    .login-card{width:min(100%,410px)}
    .panel-kicker{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-bottom:28px}
    .panel-kicker span{color:var(--muted);font-size:13px;font-weight:700}.status-chip{border:1px solid #c7e4d8;color:#0f6b54;background:#f0fbf6;border-radius:999px;padding:7px 10px;font-size:12px;font-weight:800}
    .login-card h2{margin:0;font-size:32px;line-height:1.08}.subtitle{margin:10px 0 30px;color:var(--muted);line-height:1.5}
    form{display:grid;gap:16px}
    label{display:grid;gap:8px;font-size:13px;font-weight:800;color:#263241}
    input{width:100%;min-height:48px;padding:13px 14px;border:1px solid #b9c6d6;border-radius:8px;background:#fff;color:var(--ink);font:inherit;outline:none;transition:border-color .18s ease,box-shadow .18s ease,background .18s ease}
    input:hover{border-color:#8ea0b5}input:focus{border-color:var(--primary);box-shadow:0 0 0 4px var(--ring)}
    .password-row{position:relative}.password-row input{padding-right:54px}
    .reveal{position:absolute;right:8px;bottom:8px;width:36px;height:32px;border:0;border-radius:6px;background:#eef3f7;color:#334155;font-size:12px;font-weight:800;cursor:pointer}
    .reveal:hover{background:#dfe8f1}.reveal:focus-visible{outline:3px solid var(--ring)}
    .submit{margin-top:4px;width:100%;min-height:50px;border:0;border-radius:8px;background:var(--primary);color:white;font-weight:850;font:inherit;cursor:pointer;transition:background .18s ease,box-shadow .18s ease,transform .18s ease}
    .submit:hover{background:var(--primary-strong);box-shadow:0 10px 24px rgba(10,95,159,.22)}.submit:focus-visible{outline:3px solid var(--ring);outline-offset:2px}.submit:active{transform:translateY(1px)}.submit:disabled{background:#8ca9c1;box-shadow:none;cursor:wait;transform:none}
    .error{min-height:22px;margin:0;color:var(--danger);font-weight:800;font-size:13px}
    .help{margin-top:24px;border-left:3px solid var(--teal);background:#f6fbfa;padding:13px 14px;color:#36545f;font-size:13px;line-height:1.48}
    .footer-note{margin-top:18px;color:var(--muted);font-size:12px;line-height:1.45}
    @media (prefers-reduced-motion:reduce){*,*::before,*::after{scroll-behavior:auto!important;transition:none!important}}
    @media (max-width:900px){main{grid-template-columns:1fr}.workspace{padding:30px 22px 24px;border-right:0;border-bottom:1px solid var(--line)}.brand{margin-bottom:34px}.ops-list{grid-template-columns:1fr;gap:16px;margin-top:34px}.session-note{margin-top:28px}.login-area{padding:26px 18px 36px}.login-card h2{font-size:28px}h1{font-size:42px}}
  </style>
</head>
<body>
  <main>
    <section class="workspace" aria-labelledby="login-title">
      <div>
        <div class="brand" aria-label="CEDCO">
          <div class="mark">C</div>
          <div><strong>CEDCO</strong><span>Operacion R02</span></div>
        </div>
        <span class="eyebrow">Staging privado</span>
        <h1 id="login-title">Centro operativo CEDCO</h1>
        <p class="lead">Acceso controlado para revisar agenda, conocimiento y derivaciones del flujo R02 sin activar llamadas reales ni proveedores externos.</p>
        <div class="ops-list" aria-label="Estado operativo">
          <div class="ops-item"><small>Ambiente</small><strong>Staging R02</strong><span>Validacion funcional antes de paso productivo.</span></div>
          <div class="ops-item"><small>Sesion</small><strong>8 horas</strong><span>Cookie segura cuando entras por HTTPS publico.</span></div>
          <div class="ops-item"><small>Alcance</small><strong>Sin PBX live</strong><span>Solo operaciones permitidas del panel autorizado.</span></div>
        </div>
      </div>
      <p class="session-note">Las acciones quedan auditadas por tenant y actor. Usa solamente el usuario asignado para tu rol.</p>
    </section>
    <section class="login-area" aria-label="Inicio de sesion">
      <div class="login-card">
      <div class="panel-kicker"><span>Acceso al panel operativo</span><strong class="status-chip">TLS publico</strong></div>
      <h2>Iniciar sesion</h2>
      <p class="subtitle">Ingresa con tu usuario CEDCO y credencial temporal.</p>
      <form id="login" method="post" action="/api/v1/auth/login" autocomplete="on">
        <input id="tenantId" name="tenantId" type="hidden" value="cedco-demo" autocomplete="organization" />
        <label for="username">Usuario asignado
          <input id="username" name="username" autocomplete="username" autocapitalize="none" spellcheck="false" inputmode="email" required aria-describedby="error" />
        </label>
        <label class="password-row" for="password">Credencial temporal
          <input id="password" name="password" type="password" autocomplete="current-password" required aria-describedby="error" />
          <button class="reveal" type="button" id="reveal" aria-controls="password" aria-label="Mostrar credencial">Ver</button>
        </label>
        <button class="submit" id="submit" type="submit">Entrar al panel</button>
        <p id="error" class="error" role="alert" aria-live="polite"></p>
      </form>
      <div class="help">Las credenciales no se muestran ni se guardan en esta pantalla. Si vencen, solicita una nueva al administrador.</div>
      <p class="footer-note">Acceso limitado al tenant <strong>cedco-demo</strong>.</p>
      </div>
    </section>
  </main>
  <script>
    const form = document.getElementById("login");
    const button = document.getElementById("submit");
    const error = document.getElementById("error");
    const reveal = document.getElementById("reveal");
    const authField = document.getElementById("password");
    reveal.addEventListener("click", () => {
      const visible = authField.getAttribute("type") === "text";
      authField.setAttribute("type", visible ? "password" : "text");
      reveal.textContent = visible ? "Ver" : "Ocultar";
      reveal.setAttribute("aria-label", visible ? "Mostrar credencial" : "Ocultar credencial");
    });
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      error.textContent = "";
      button.disabled = true;
      button.textContent = "Validando...";
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
        button.textContent = "Entrar al panel";
      }
    });
  </script>
</body>
</html>`;
}
