CREATE TABLE "LocalAuthCredential" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "loginRef" TEXT NOT NULL,
  "credentialHash" TEXT NOT NULL,
  "credentialSalt" TEXT NOT NULL,
  "kdf" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "resetRequired" BOOLEAN NOT NULL DEFAULT true,
  "failedAttempts" INTEGER NOT NULL DEFAULT 0,
  "lockedUntil" TIMESTAMP(3),
  "lastVerifiedAt" TIMESTAMP(3),
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "LocalAuthCredential_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LocalAuthSession" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "sessionHash" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "userAgentHash" TEXT,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "revokedAt" TIMESTAMP(3),
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "LocalAuthSession_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "LocalAuthCredential_tenantId_loginRef_key"
  ON "LocalAuthCredential"("tenantId", "loginRef");
CREATE INDEX "LocalAuthCredential_tenantId_idx" ON "LocalAuthCredential"("tenantId");
CREATE INDEX "LocalAuthCredential_userId_idx" ON "LocalAuthCredential"("userId");
CREATE INDEX "LocalAuthCredential_status_idx" ON "LocalAuthCredential"("status");

CREATE UNIQUE INDEX "LocalAuthSession_sessionHash_key" ON "LocalAuthSession"("sessionHash");
CREATE INDEX "LocalAuthSession_tenantId_userId_status_idx"
  ON "LocalAuthSession"("tenantId", "userId", "status");
CREATE INDEX "LocalAuthSession_expiresAt_idx" ON "LocalAuthSession"("expiresAt");
