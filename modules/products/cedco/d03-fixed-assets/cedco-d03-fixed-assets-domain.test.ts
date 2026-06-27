import { describe, expect, it } from "vitest";
import {
  InMemoryFixedAssetRepository,
  createCedcoD03SafeAssetInput,
  createCedcoD03TestContext,
} from "../../../../packages/testing/src/products/cedco/d03-fixed-assets";
import {
  createAssetMetadata,
  createFixedAssetId,
  evaluateAssetDepreciationPolicy,
  evaluateImportReadiness,
  moveFixedAsset,
  recordMaintenance,
  registerFixedAsset,
} from "./src";

describe("CEDCO D03 fixed assets domain contracts", () => {
  it("accepts safe fixed asset ids", () => {
    const result = createFixedAssetId("asset-d03-test-001");

    expect(result.ok).toBe(true);
  });

  it("rejects unsafe fixed asset ids", () => {
    const result = createFixedAssetId("Asset D03 001");

    expect(result.ok).toBe(false);
  });

  it("registers a fixed asset with synthetic tenant-scoped data", async () => {
    const repository = new InMemoryFixedAssetRepository();
    const context = createCedcoD03TestContext();

    const result = await registerFixedAsset({
      context,
      repository,
      ...createCedcoD03SafeAssetInput(),
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.tenantId).toBe("cedco-d03-test");
    expect(result.value.status).toBe("draft");
    expect(await repository.listByTenant("cedco-d03-test")).toHaveLength(1);
  });

  it("requires tenantId through operation context", async () => {
    const repository = new InMemoryFixedAssetRepository();
    const context = createCedcoD03TestContext({ tenantId: "" });

    const result = await registerFixedAsset({
      context,
      repository,
      ...createCedcoD03SafeAssetInput(),
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("invalid_operation_context");
  });

  it("blocks metadata with real serial references", async () => {
    const repository = new InMemoryFixedAssetRepository();
    const context = createCedcoD03TestContext();

    const result = await registerFixedAsset({
      context,
      repository,
      ...createCedcoD03SafeAssetInput(),
      metadata: { serialRef: "blocked-real-looking-reference" },
    });

    expect(result.ok).toBe(false);
  });

  it("blocks billing document references", async () => {
    const repository = new InMemoryFixedAssetRepository();
    const context = createCedcoD03TestContext();

    const result = await registerFixedAsset({
      context,
      repository,
      ...createCedcoD03SafeAssetInput(),
      metadata: { invoiceRef: "blocked-billing-reference" },
    });

    expect(result.ok).toBe(false);
  });

  it("blocks responsible person PII", async () => {
    const repository = new InMemoryFixedAssetRepository();
    const context = createCedcoD03TestContext();

    const result = await registerFixedAsset({
      context,
      repository,
      ...createCedcoD03SafeAssetInput(),
      metadata: { custodianEmail: "persona@example.com" },
    });

    expect(result.ok).toBe(false);
  });

  it("blocks photo metadata", async () => {
    const metadata = createAssetMetadata({ photoRef: "blocked-photo-reference" });

    expect(metadata.ok).toBe(false);
  });

  it("moves a fixed asset with safe location refs", async () => {
    const repository = new InMemoryFixedAssetRepository();
    const context = createCedcoD03TestContext();
    const registered = await registerFixedAsset({
      context,
      repository,
      ...createCedcoD03SafeAssetInput(),
    });
    expect(registered.ok).toBe(true);

    const result = await moveFixedAsset({
      context,
      repository,
      assetId: "asset-d03-test-001",
      toLocationId: "location-consultorio-test",
      reason: "Synthetic relocation",
      metadata: { source: "unit-test" },
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.asset.currentLocationId).toBe("location-consultorio-test");
    expect(result.value.movement.fromLocationId).toBe("location-bodega-test");
  });

  it("records maintenance without real documents or photos", async () => {
    const repository = new InMemoryFixedAssetRepository();
    const context = createCedcoD03TestContext();
    await registerFixedAsset({
      context,
      repository,
      ...createCedcoD03SafeAssetInput(),
    });

    const result = await recordMaintenance({
      context,
      repository,
      assetId: "asset-d03-test-001",
      maintenanceType: "inspection",
      summary: "Synthetic inspection record",
      metadata: { source: "unit-test" },
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.asset.status).toBe("in-maintenance");
  });

  it("blocks real file import readiness", () => {
    const readiness = evaluateImportReadiness({
      tenantId: "cedco-d03-test",
      sourceKind: "file-upload",
      metadata: { source: "unit-test" },
    });

    expect(readiness.ready).toBe(false);
    expect(readiness.blockedReasons).toContain("bulk_file_import_blocked");
  });

  it("allows manual-entry import readiness only with safe metadata", () => {
    const readiness = evaluateImportReadiness({
      tenantId: "cedco-d03-test",
      sourceKind: "manual-entry",
      metadata: { source: "synthetic" },
    });

    expect(readiness.ready).toBe(true);
  });

  it("keeps depreciation rules blocked for future review", () => {
    const result = evaluateAssetDepreciationPolicy();

    expect(result.supported).toBe(false);
    expect(result.blockedReasons).toContain("depreciation_rules_pending_future_loop");
  });
});
