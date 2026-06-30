import { PrismaClient } from "@prisma/client";
import { createHash, randomBytes, scrypt as scryptCallback } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required for R02 staging auth bootstrap.");
}

const tenantId = process.env.R02_AUTH_TENANT_ID ?? "cedco-demo";
const rotate = process.env.R02_AUTH_ROTATE_CREDENTIALS === "true";
const printCredentials = process.env.R02_AUTH_PRINT_CREDENTIALS === "true";
const outputPath = process.env.R02_AUTH_OUTPUT_PATH;

const users = [
  { userId: "cedco-admin", displayName: "CEDCO Admin", role: "cedco_admin" },
  { userId: "r02-operator", displayName: "R02 Operator", role: "r02_operator" },
  { userId: "compliance-auditor", displayName: "Compliance Auditor", role: "compliance_auditor" },
  { userId: "reports-viewer", displayName: "Reports Viewer", role: "reports_viewer" },
  { userId: "integration-admin", displayName: "Integration Admin", role: "integration_admin" },
  {
    userId: "human-handoff-agent",
    displayName: "Human Handoff Agent",
    role: "human_handoff_agent",
  },
];

const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });

try {
  await prisma.tenant.upsert({
    where: { id: tenantId },
    create: {
      id: tenantId,
      name: "CEDCO Demo",
      status: "active",
      locale: "es-CO",
      timezone: "America/Bogota",
      dataRetentionDays: 30,
      piiPolicy: {},
      metadata: { source: "r02-staging-auth-bootstrap" },
    },
    update: {
      name: "CEDCO Demo",
      status: "active",
      metadata: { source: "r02-staging-auth-bootstrap" },
    },
  });

  const generated = [];
  for (const user of users) {
    await prisma.user.upsert({
      where: { id: user.userId },
      create: {
        id: user.userId,
        displayName: user.displayName,
        status: "active",
        metadata: { source: "r02-staging-auth-bootstrap" },
      },
      update: {
        displayName: user.displayName,
        status: "active",
        metadata: { source: "r02-staging-auth-bootstrap" },
      },
    });
    await prisma.tenantMembership.upsert({
      where: { tenantId_userId: { tenantId, userId: user.userId } },
      create: {
        id: `membership-${tenantId}-${user.userId}`,
        tenantId,
        userId: user.userId,
        roles: [user.role],
        status: "active",
      },
      update: {
        roles: [user.role],
        status: "active",
      },
    });

    const loginRef = user.userId;
    const existing = await prisma.localAuthCredential.findUnique({
      where: { tenantId_loginRef: { tenantId, loginRef } },
    });
    if (!existing || rotate) {
      const temporaryCredential = randomBytes(18).toString("base64url");
      const salt = randomBytes(16).toString("base64url");
      const credentialHash = await hashCredential(temporaryCredential, salt);
      await prisma.localAuthCredential.upsert({
        where: { tenantId_loginRef: { tenantId, loginRef } },
        create: {
          id: `local-auth-${tenantId}-${user.userId}`,
          tenantId,
          userId: user.userId,
          loginRef,
          credentialHash,
          credentialSalt: salt,
          kdf: "scrypt",
          status: "active",
          resetRequired: true,
          metadata: { source: "r02-staging-auth-bootstrap" },
        },
        update: {
          credentialHash,
          credentialSalt: salt,
          kdf: "scrypt",
          status: "active",
          resetRequired: true,
          failedAttempts: 0,
          lockedUntil: null,
          metadata: { source: "r02-staging-auth-bootstrap", rotatedAt: new Date().toISOString() },
        },
      });
      generated.push({
        tenantId,
        loginRef,
        temporaryCredential,
        role: user.role,
        resetRequired: true,
      });
    }
  }

  const summary = {
    tenantId,
    usersSeeded: users.length,
    credentialsGenerated: generated.length,
    credentialsRotated: rotate,
    credentialsPersistedInRepo: false,
    generatedAt: new Date().toISOString(),
  };
  console.log(JSON.stringify(summary, null, 2));
  if (printCredentials && generated.length > 0) {
    console.log("R02_STAGING_TEMPORARY_CREDENTIALS_BEGIN");
    for (const item of generated) {
      console.log(
        [
          `tenant=${item.tenantId}`,
          `login=${item.loginRef}`,
          `role=${item.role}`,
          `temporary_credential=${item.temporaryCredential}`,
          `reset_required=${item.resetRequired}`,
        ].join(" "),
      );
    }
    console.log("R02_STAGING_TEMPORARY_CREDENTIALS_END");
  }
  if (outputPath && generated.length > 0) {
    await mkdir(path.dirname(outputPath), { recursive: true });
    await writeFile(
      outputPath,
      [
        "R02 staging temporary credentials",
        "Store outside Git. Rotate after operator handoff.",
        ...generated.map((item) =>
          [
            `tenant=${item.tenantId}`,
            `login=${item.loginRef}`,
            `role=${item.role}`,
            `temporary_credential=${item.temporaryCredential}`,
            `reset_required=${item.resetRequired}`,
          ].join(" "),
        ),
        "",
      ].join("\n"),
      { mode: 0o600 },
    );
  }
} finally {
  await prisma.$disconnect();
}

async function hashCredential(credential, salt) {
  const hash = await scrypt(credential, salt, 64);
  return Buffer.from(hash).toString("hex");
}

export function hashBootstrapReference(value) {
  return createHash("sha256").update(value, "utf8").digest("hex").slice(0, 24);
}
