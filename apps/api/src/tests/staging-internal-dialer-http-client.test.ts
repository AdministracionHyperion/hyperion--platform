import { describe, expect, it } from "vitest";
import { createApiApp } from "../app";
import { createFakeApiServices } from "../services";
import {
  parseAllowedStagingDialerBaseUrl,
  stagingInternalDialerDryRunPath,
  StagingInternalDialerHttpClient,
  type StagingDialerFetch,
} from "../services/staging-internal-dialer-http-client";
import type { CedcoD02InternalDialerDryRunRequest } from "../../../../modules/products/cedco/d02-calls/src/application/dialer-dry-run";

const safeRequest: CedcoD02InternalDialerDryRunRequest = {
  idempotency_key: "hyperion-key-staging-http-001",
  external_request_id: "external-request-staging-http-001",
  mode: "single",
  runtimeMode: "dry_run",
  safe_contact_ref: "safe-contact-ref-staging-http",
  agent_alias: "cedco-d02-agent",
  caller_alias: "cedco-d02-caller",
  consent: { granted: true },
  consent_ref: "consent-ref-staging-http",
  internal_event_topic: "internal.events.cedco.d02.dialer_dry_run",
  dynamic_vars: { purpose: "orientation", priority: "normal" },
  metadata: { source: "staging-http-client-test" },
};

const d02Url = "/api/v1/tenants/cedco-test/products/cedco/d02/dialer/dry-run";
const d02Headers = {
  "x-actor-id": "actor-test",
  "x-actor-roles": "tenant-admin",
  "x-correlation-id": "corr-staging-http-d02-001",
  "Idempotency-Key": "hyperion-key-staging-d02-001",
};
const d02Payload = {
  safe_contact_ref: "safe-contact-ref-staging-d02",
  patient_context_ref: "patient-context-ref-staging-d02",
  consent: { granted: true },
  consent_ref: "consent-ref-staging-d02",
  call_purpose: "orientation",
  objective: "orientation",
  metadata: { source: "staging-http-client-test" },
} as const;

describe("StagingInternalDialerHttpClient", () => {
  it("rejects empty base URL", () => {
    expect(() => parseAllowedStagingDialerBaseUrl(" ")).toThrow(
      "INTERNAL_DIALER_BASE_URL is required",
    );
  });

  it("accepts loopback and hyperion-staging internal hosts", () => {
    expect(parseAllowedStagingDialerBaseUrl("http://localhost:18081").hostname).toBe("localhost");
    expect(
      parseAllowedStagingDialerBaseUrl("http://hyperion-staging-dialer-api:8080").hostname,
    ).toBe("hyperion-staging-dialer-api");
  });

  it("rejects public-style URLs", () => {
    expect(() => parseAllowedStagingDialerBaseUrl("http://example.invalid:8080")).toThrow(
      "loopback or hyperion-staging",
    );
    expect(() => parseAllowedStagingDialerBaseUrl("https://localhost:18081")).toThrow(
      "must use http",
    );
  });

  it("calls only the dry-run endpoint with idempotency header", async () => {
    const calls: CapturedFetchCall[] = [];
    const client = new StagingInternalDialerHttpClient({
      baseUrl: "http://hyperion-staging-dialer-api:8080",
      fetchImpl: acceptedFetch(calls),
    });

    const result = await client.dryRun(safeRequest);
    const call = calls[0]!;
    const body = JSON.parse(call.init.body) as Record<string, unknown>;

    expect(result.status).toBe("dry_run_accepted");
    expect(result.provider_egress).toBe(false);
    expect(result.would_call_provider).toBe(false);
    expect(client.networkCallsMade).toBe(1);
    expect(new URL(call.input).pathname).toBe(stagingInternalDialerDryRunPath);
    expect(call.init.headers["Idempotency-Key"]).toBe("hyperion-key-staging-http-001");
    expect(body).toMatchObject({
      source: "hyperion-platform-staging",
      safe_contact_ref: "safe-contact-ref-staging-http",
      consent_ref: "consent-ref-staging-http",
      agent_ref: "cedco-d02-agent",
    });
    expect(JSON.stringify(body)).not.toMatch(
      /phone_number_id|agent_id|\+[1-9][0-9]{7,14}|token|secret|password/iu,
    );
  });

  it("fails closed if provider egress is reported", async () => {
    const client = new StagingInternalDialerHttpClient({
      baseUrl: "http://localhost:18081",
      fetchImpl: acceptedFetch([], { provider_egress: true }),
    });

    await expect(client.dryRun(safeRequest)).rejects.toThrow("provider egress guard");
  });

  it("fails closed if provider call would be attempted", async () => {
    const client = new StagingInternalDialerHttpClient({
      baseUrl: "http://localhost:18081",
      fetchImpl: acceptedFetch([], { would_call_provider: true }),
    });

    await expect(client.dryRun(safeRequest)).rejects.toThrow("provider call guard");
  });

  it("maps idempotency conflict to a blocked dry-run result", async () => {
    const client = new StagingInternalDialerHttpClient({
      baseUrl: "http://localhost:18081",
      fetchImpl: conflictFetch(),
    });

    const result = await client.dryRun(safeRequest);

    expect(result.status).toBe("blocked");
    expect(result.blocked_reasons).toContain("idempotency_conflict");
    expect(result.provider_egress).toBe(false);
    expect(result.would_call_provider).toBe(false);
  });

  it("rejects dispatch without network access", async () => {
    const client = new StagingInternalDialerHttpClient({
      baseUrl: "http://localhost:18081",
      fetchImpl: acceptedFetch([]),
    });

    await expect(client.dispatch()).rejects.toThrow("Live dispatch is disabled");
    expect(client.networkCallsMade).toBe(0);
  });

  it("lets the CEDCO D02 API use the staging dry-run client", async () => {
    const calls: CapturedFetchCall[] = [];
    const client = new StagingInternalDialerHttpClient({
      baseUrl: "http://hyperion-staging-dialer-api:8080",
      fetchImpl: acceptedFetch(calls, {
        idempotency_key: "hyperion-key-staging-d02-001",
        internal_call_id: "dryrun_staging_d02_001",
      }),
    });
    const app = await createApiApp({
      services: createFakeApiServices({ dialerDryRun: client }),
    });

    const response = await app.inject({
      method: "POST",
      url: d02Url,
      headers: d02Headers,
      payload: d02Payload,
    });
    const body = response.json<{
      readonly ok: boolean;
      readonly data?: {
        readonly status: string;
        readonly provider_egress: boolean;
        readonly would_call_provider: boolean;
        readonly internal_call_id: string;
      };
    }>();

    expect(response.statusCode).toBe(200);
    expect(body.data?.status).toBe("dry_run_accepted");
    expect(body.data?.provider_egress).toBe(false);
    expect(body.data?.would_call_provider).toBe(false);
    expect(body.data?.internal_call_id).toBe("dryrun_staging_d02_001");
    expect(calls).toHaveLength(1);

    await app.close();
  });
});

interface CapturedFetchCall {
  readonly input: string;
  readonly init: Parameters<StagingDialerFetch>[1];
}

function acceptedFetch(
  calls: CapturedFetchCall[],
  patch: Readonly<Record<string, unknown>> = {},
): StagingDialerFetch {
  return async (input, init) => {
    calls.push({ input, init });
    const response = {
      status: "dry_run_accepted",
      idempotency_key: "hyperion-key-staging-http-001",
      internal_call_id: "dryrun_staging_http_001",
      blocked_reasons: [],
      would_call_provider: false,
      provider_egress: false,
      metadata: { source: "staging-http-client-test" },
      ...patch,
    };
    return {
      status: 202,
      json: async () => response,
      text: async () => JSON.stringify(response),
    };
  };
}

function conflictFetch(): StagingDialerFetch {
  return async () => ({
    status: 409,
    json: async () => ({ detail: "idempotency conflict" }),
    text: async () => "idempotency conflict",
  });
}
