import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { toPrismaJson, type HyperionPrismaClient } from "../../../../packages/db/src";
import { missingActorError } from "../http/api-error";
import type {
  ApiAuthServices,
  LocalAuthLoginInput,
  LocalAuthLoginResult,
  LocalAuthPrincipal,
} from "./api-services";

const scrypt = promisify(scryptCallback);
const sessionDurationMs = 8 * 60 * 60 * 1000;
const maxFailedAttempts = 5;
const lockDurationMs = 5 * 60 * 1000;

export function createLocalStagingAuthService(prisma: HyperionPrismaClient): ApiAuthServices {
  return new LocalStagingAuthService(prisma);
}

export async function hashLocalCredential(credential: string, salt: string): Promise<string> {
  const hash = (await scrypt(credential, salt, 64)) as Buffer;
  return hash.toString("hex");
}

export function createLocalCredentialSalt(): string {
  return randomBytes(16).toString("base64url");
}

export function createLocalSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashLocalSessionToken(sessionToken: string): string {
  return createHash("sha256").update(sessionToken, "utf8").digest("hex");
}

export function hashLocalAuthReference(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex").slice(0, 24);
}

class LocalStagingAuthService implements ApiAuthServices {
  public constructor(private readonly prisma: HyperionPrismaClient) {}

  async login(input: LocalAuthLoginInput): Promise<LocalAuthLoginResult> {
    const loginRef = normalizeLoginRef(input.loginRef);
    const credential = await this.prisma.localAuthCredential.findUnique({
      where: { tenantId_loginRef: { tenantId: input.tenantId, loginRef } },
    });
    if (!credential || credential.status !== "active") {
      await this.recordLoginAudit(input.tenantId, undefined, "failure", "credential_not_found", {
        loginRefHash: hashLocalAuthReference(loginRef),
      });
      throwInvalidLogin();
    }
    if (credential.lockedUntil && credential.lockedUntil > new Date()) {
      await this.recordLoginAudit(input.tenantId, credential.userId, "failure", "locked", {
        loginRefHash: hashLocalAuthReference(loginRef),
      });
      throwInvalidLogin();
    }

    const hash = await hashLocalCredential(input.credential, credential.credentialSalt);
    if (!safeEqualHex(hash, credential.credentialHash)) {
      await this.registerFailedAttempt(credential.id, credential.failedAttempts + 1);
      await this.recordLoginAudit(input.tenantId, credential.userId, "failure", "invalid", {
        loginRefHash: hashLocalAuthReference(loginRef),
      });
      throwInvalidLogin();
    }

    const [user, membership] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: credential.userId } }),
      this.prisma.tenantMembership.findUnique({
        where: { tenantId_userId: { tenantId: input.tenantId, userId: credential.userId } },
      }),
    ]);
    if (!user || user.status !== "active" || !membership || membership.status !== "active") {
      await this.recordLoginAudit(input.tenantId, credential.userId, "failure", "inactive", {
        loginRefHash: hashLocalAuthReference(loginRef),
      });
      throwInvalidLogin();
    }

    const sessionToken = createLocalSessionToken();
    const sessionHash = hashLocalSessionToken(sessionToken);
    const expiresAt = new Date(Date.now() + sessionDurationMs);
    const session = await this.prisma.localAuthSession.create({
      data: {
        id: `local-session-${Date.now()}-${randomBytes(6).toString("hex")}`,
        tenantId: input.tenantId,
        userId: user.id,
        sessionHash,
        status: "active",
        userAgentHash: input.userAgent ? hashLocalAuthReference(input.userAgent) : null,
        expiresAt,
        metadata: toPrismaJson({ provider: "local-staging" }),
      },
    });

    await this.prisma.localAuthCredential.update({
      where: { id: credential.id },
      data: { failedAttempts: 0, lockedUntil: null, lastVerifiedAt: new Date() },
    });
    await this.recordLoginAudit(input.tenantId, user.id, "success", "login", {
      sessionId: session.id,
      loginRefHash: hashLocalAuthReference(loginRef),
    });

    return {
      sessionToken,
      principal: toPrincipal({
        tenantId: input.tenantId,
        actorId: user.id,
        displayName: user.displayName ?? undefined,
        loginRef,
        resetRequired: credential.resetRequired,
        roles: parsePersistedRoles(membership.roles),
        sessionId: session.id,
        expiresAt,
      }),
    };
  }

  async resolveSession(
    sessionToken: string,
    tenantId?: string,
  ): Promise<LocalAuthPrincipal | undefined> {
    const sessionHash = hashLocalSessionToken(sessionToken);
    const session = await this.prisma.localAuthSession.findUnique({ where: { sessionHash } });
    if (
      !session ||
      session.status !== "active" ||
      session.expiresAt <= new Date() ||
      (tenantId && session.tenantId !== tenantId)
    ) {
      return undefined;
    }

    const [user, membership, credential] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: session.userId } }),
      this.prisma.tenantMembership.findUnique({
        where: { tenantId_userId: { tenantId: session.tenantId, userId: session.userId } },
      }),
      this.prisma.localAuthCredential.findFirst({
        where: { tenantId: session.tenantId, userId: session.userId, status: "active" },
      }),
    ]);
    if (!user || user.status !== "active" || !membership || membership.status !== "active") {
      return undefined;
    }

    return toPrincipal({
      tenantId: session.tenantId,
      actorId: user.id,
      displayName: user.displayName ?? undefined,
      loginRef: credential?.loginRef ?? "local-auth",
      resetRequired: credential?.resetRequired ?? false,
      roles: parsePersistedRoles(membership.roles),
      sessionId: session.id,
      expiresAt: session.expiresAt,
    });
  }

  async logout(sessionToken: string): Promise<{ revoked: boolean }> {
    const sessionHash = hashLocalSessionToken(sessionToken);
    const session = await this.prisma.localAuthSession.findUnique({ where: { sessionHash } });
    const result = await this.prisma.localAuthSession.updateMany({
      where: { sessionHash, status: "active" },
      data: { status: "revoked", revokedAt: new Date() },
    });
    if (session && result.count > 0) {
      await this.recordLoginAudit(session.tenantId, session.userId, "success", "logout", {
        sessionId: session.id,
      });
    }
    return { revoked: result.count > 0 };
  }

  private async registerFailedAttempt(credentialId: string, attempts: number): Promise<void> {
    await this.prisma.localAuthCredential.update({
      where: { id: credentialId },
      data: {
        failedAttempts: attempts,
        ...(attempts >= maxFailedAttempts
          ? { lockedUntil: new Date(Date.now() + lockDurationMs) }
          : {}),
      },
    });
  }

  private async recordLoginAudit(
    tenantId: string,
    actorId: string | undefined,
    result: "success" | "failure",
    reason: string,
    metadata: Readonly<Record<string, unknown>>,
  ): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        id: `audit-local-auth-${Date.now()}-${randomBytes(6).toString("hex")}`,
        tenantId,
        actorId,
        correlationId: `auth-${Date.now().toString(36)}`,
        action: `${reason === "logout" ? "auth.logout" : "auth.login"}.${result}`,
        resourceType: "local_auth",
        resourceId: reason,
        result,
        metadata: toPrismaJson(metadata),
        occurredAt: new Date(),
      },
    });
  }
}

function toPrincipal(input: LocalAuthPrincipal): LocalAuthPrincipal {
  return {
    tenantId: input.tenantId,
    actorId: input.actorId,
    ...(input.displayName ? { displayName: input.displayName } : {}),
    roles: input.roles,
    loginRef: input.loginRef,
    resetRequired: input.resetRequired,
    ...(input.sessionId ? { sessionId: input.sessionId } : {}),
    ...(input.expiresAt ? { expiresAt: input.expiresAt } : {}),
  };
}

function parsePersistedRoles(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map((role) => String(role)).filter((role) => role.length > 0);
}

function normalizeLoginRef(value: string): string {
  return value.trim().toLowerCase();
}

function safeEqualHex(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left, "hex");
  const rightBuffer = Buffer.from(right, "hex");
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function throwInvalidLogin(): never {
  throw missingActorError("Invalid local staging credentials.");
}
