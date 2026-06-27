import { describe, expect, it } from "vitest";

import { sanitizeAuditMetadata } from "./audit/src";
import { recordAuditEvent } from "./audit/src/use-cases/record-audit-event";
import { createEventEnvelope } from "./event-bus/src";
import { evaluateFeatureFlag } from "./feature-flags/src";
import { recordFeedbackEvent } from "./feedback/src";
import { createActorId } from "./identity-access/src";
import { authorizeActorAction } from "./identity-access/src/use-cases/authorize-actor-action";
import { createTenantId, enforceTenantIsolation } from "./tenancy/src";
import { activateVersion } from "./versioning/src/use-cases/activate-version";
import { archiveVersion } from "./versioning/src/use-cases/archive-version";
import { createVersionDraft } from "./versioning/src/use-cases/create-version-draft";
import { createOperationContext, redactedMetadataValue } from "../../packages/shared/src/core";
import {
  InMemoryAuditLog,
  InMemoryFeatureFlagRepository,
  InMemoryFeedbackRepository,
  InMemoryVersionRepository,
  createTestActorContext,
  createTestOperationContext,
} from "../../packages/testing/src/core";

describe("core platform domain", () => {
  it("rejects invalid TenantId values", () => {
    expect(createTenantId("tenant-alpha").ok).toBe(true);
    expect(createTenantId("Tenant Alpha").ok).toBe(false);
    expect(createTenantId("tenant alpha").ok).toBe(false);
    expect(createTenantId("tenant_alpha").ok).toBe(false);
    expect(createTenantId("").ok).toBe(false);
  });

  it("allows tenant isolation for the same tenant", () => {
    const context = createTestOperationContext({ tenantId: "tenant-alpha" });

    expect(enforceTenantIsolation(context, { tenantId: "tenant-alpha" }).ok).toBe(true);
  });

  it("rejects cross-tenant access", () => {
    const context = createTestOperationContext({ tenantId: "tenant-alpha" });

    expect(enforceTenantIsolation(context, { tenantId: "tenant-beta" }).ok).toBe(false);
  });

  it("allows super-admin for any permission", () => {
    const context = createTestOperationContext({ actorId: "actor-admin" });
    const actor = createTestActorContext({ actorId: "actor-admin", roles: ["super-admin"] });

    expect(
      authorizeActorAction({
        actor,
        context,
        permission: "platform:tenant:create",
      }).ok,
    ).toBe(true);
  });

  it("denies tenant-viewer for voice dispatch", () => {
    const context = createTestOperationContext({ actorId: "actor-viewer" });
    const actor = createTestActorContext({ actorId: "actor-viewer", roles: ["tenant-viewer"] });

    expect(
      authorizeActorAction({
        actor,
        context,
        permission: "voice:call:dispatch",
      }).ok,
    ).toBe(false);
  });

  it("allows voice-operator for voice dispatch", () => {
    const context = createTestOperationContext({ actorId: "actor-operator" });
    const actor = createTestActorContext({ actorId: "actor-operator", roles: ["voice-operator"] });

    expect(
      authorizeActorAction({
        actor,
        context,
        permission: "voice:call:dispatch",
      }).ok,
    ).toBe(true);
  });

  it("requires correlationId in OperationContext", () => {
    const context = createOperationContext({
      tenantId: "tenant-alpha",
      actorId: "actor-admin",
      correlationId: "",
      source: "unit-test",
    });

    expect(context.ok).toBe(false);
  });

  it("redacts sensitive audit metadata", () => {
    const metadata = sanitizeAuditMetadata({
      phone: "+570000000000",
      email: "person@example.invalid",
      token: "value",
      rawTranscript: "raw text",
      audioUrl: "https://example.invalid/audio.wav",
      safe: "kept",
    });

    expect(metadata.phone).toBe(redactedMetadataValue);
    expect(metadata.email).toBe(redactedMetadataValue);
    expect(metadata.token).toBe(redactedMetadataValue);
    expect(metadata.rawTranscript).toBe(redactedMetadataValue);
    expect(metadata.audioUrl).toBe(redactedMetadataValue);
    expect(metadata.safe).toBe("kept");
  });

  it("records audit events with sanitized metadata", async () => {
    const auditLog = new InMemoryAuditLog();
    const context = createTestOperationContext();

    await recordAuditEvent(auditLog, {
      context,
      action: "tenant.context.resolved",
      resourceType: "tenant",
      resourceId: "tenant-alpha",
      result: "success",
      metadata: { phoneNumber: "555", safe: "ok" },
    });

    const events = await auditLog.findByTenant("tenant-alpha");
    expect(events).toHaveLength(1);
    expect(events[0]?.metadata.phoneNumber).toBe(redactedMetadataValue);
    expect(events[0]?.metadata.safe).toBe("ok");
  });

  it("creates event envelopes with tenantId, actorId, and correlationId", () => {
    const context = createTestOperationContext();
    const envelope = createEventEnvelope(context, {
      type: "core.test",
      payload: { ok: true },
      occurredAt: context.occurredAt,
    });

    expect(envelope.tenantId).toBe(context.tenantId);
    expect(envelope.actorId).toBe(context.actorId);
    expect(envelope.correlationId).toBe(context.correlationId);
  });

  it("prefers tenant-scoped feature flags over global flags", async () => {
    const repository = new InMemoryFeatureFlagRepository();
    const createdAt = new Date("2026-06-26T00:00:00.000Z");

    await repository.save({
      flagKey: "voice.egress",
      enabled: false,
      description: "global default",
      createdAt,
    });
    await repository.save({
      flagKey: "voice.egress",
      tenantId: "tenant-alpha",
      enabled: true,
      description: "tenant override",
      createdAt,
    });

    await expect(
      evaluateFeatureFlag({
        flagKey: "voice.egress",
        tenantId: "tenant-alpha",
        repository,
      }),
    ).resolves.toBe(true);
  });

  it("returns false for missing feature flags", async () => {
    const repository = new InMemoryFeatureFlagRepository();

    await expect(
      evaluateFeatureFlag({
        flagKey: "missing.flag",
        tenantId: "tenant-alpha",
        repository,
      }),
    ).resolves.toBe(false);
  });

  it("keeps only one active version per tenant resource", async () => {
    const repository = new InMemoryVersionRepository();
    const context = createTestOperationContext();
    const firstDraft = await createVersionDraft({
      context,
      repository,
      resourceType: "agent",
      resourceId: "agent-main",
    });
    const secondDraft = await createVersionDraft({
      context,
      repository,
      resourceType: "agent",
      resourceId: "agent-main",
    });

    expect(firstDraft.ok).toBe(true);
    expect(secondDraft.ok).toBe(true);
    if (!firstDraft.ok || !secondDraft.ok) {
      throw new Error("draft creation failed");
    }

    await activateVersion({ context, repository, versionId: firstDraft.value.versionId });
    await activateVersion({ context, repository, versionId: secondDraft.value.versionId });

    const versions = await repository.findByResource("tenant-alpha", "agent", "agent-main");
    expect(versions.filter((version) => version.status === "active")).toHaveLength(1);
    expect(
      versions.find((version) => version.versionId === firstDraft.value.versionId)?.status,
    ).toBe("archived");
    expect(
      versions.find((version) => version.versionId === secondDraft.value.versionId)?.status,
    ).toBe("active");
  });

  it("archives versions without deleting history", async () => {
    const repository = new InMemoryVersionRepository();
    const context = createTestOperationContext();
    const draft = await createVersionDraft({
      context,
      repository,
      resourceType: "knowledge-base",
      resourceId: "kb-main",
    });

    expect(draft.ok).toBe(true);
    if (!draft.ok) {
      throw new Error("draft creation failed");
    }

    await archiveVersion({ context, repository, versionId: draft.value.versionId });

    const versions = await repository.findByResource("tenant-alpha", "knowledge-base", "kb-main");
    expect(versions).toHaveLength(1);
    expect(versions[0]?.status).toBe("archived");
  });

  it("records feedback with sanitized metadata", async () => {
    const repository = new InMemoryFeedbackRepository();
    const context = createTestOperationContext();

    await recordFeedbackEvent({
      context,
      repository,
      source: "human",
      resourceType: "interaction",
      resourceId: "interaction-001",
      outcome: "needs_review",
      score: 0.5,
      metadata: {
        email: "person@example.invalid",
        audioUrl: "https://example.invalid/audio.wav",
        safe: "kept",
      },
    });

    const events = await repository.findByTenant("tenant-alpha");
    expect(events).toHaveLength(1);
    expect(events[0]?.metadata.email).toBe(redactedMetadataValue);
    expect(events[0]?.metadata.audioUrl).toBe(redactedMetadataValue);
    expect(events[0]?.metadata.safe).toBe("kept");
  });

  it("creates safe ActorId values without PII characters", () => {
    expect(createActorId("actor-admin").ok).toBe(true);
    expect(createActorId("person@example.invalid").ok).toBe(false);
  });
});
