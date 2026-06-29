import { sanitizeMetadata, type SafeMetadata } from "../../../../packages/shared/src/core";
import type { DialerBlockedReason } from "../../../../modules/integrations/provider-adapters/internal-dialer/src";
import type {
  CedcoD02InternalDialerDryRunPort,
  CedcoD02InternalDialerDryRunRequest,
  CedcoD02InternalDialerDryRunResult,
} from "../../../../modules/products/cedco/d02-calls/src/application/dialer-dry-run";

export const stagingInternalDialerDryRunPath = "/internal/hyperion/calls/dry-run";

export interface StagingDialerFetchResponse {
  readonly status: number;
  json(): Promise<unknown>;
  text(): Promise<string>;
}

export type StagingDialerFetch = (
  input: string,
  init: {
    readonly method: "POST";
    readonly headers: Readonly<Record<string, string>>;
    readonly body: string;
  },
) => Promise<StagingDialerFetchResponse>;

export interface StagingInternalDialerHttpClientInput {
  readonly baseUrl: string;
  readonly fetchImpl?: StagingDialerFetch;
}

export class StagingInternalDialerHttpClient implements CedcoD02InternalDialerDryRunPort {
  public readonly targetUrl: string;
  public networkCallsMade = 0;

  private readonly fetchImpl: StagingDialerFetch;

  public constructor(input: StagingInternalDialerHttpClientInput) {
    const baseUrl = parseAllowedStagingDialerBaseUrl(input.baseUrl);
    this.targetUrl = new URL(stagingInternalDialerDryRunPath, `${baseUrl.origin}/`).toString();
    this.fetchImpl = input.fetchImpl ?? (globalThis.fetch as unknown as StagingDialerFetch);
  }

  public async dryRun(
    request: CedcoD02InternalDialerDryRunRequest,
  ): Promise<CedcoD02InternalDialerDryRunResult> {
    const idempotencyKey = request.idempotency_key ?? "";
    this.networkCallsMade += 1;
    const response = await this.fetchImpl(this.targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify(toHyperionDialerPayload(request)),
    });

    if (response.status === 409) {
      return blockedResult(request, "idempotency_conflict", {
        source: "staging_internal_dialer_http_client",
        reason: "idempotency_conflict",
      });
    }

    const payload = await parseJsonResponse(response);
    if (response.status < 200 || response.status >= 300) {
      return blockedResult(request, "unsafe_payload", {
        source: "staging_internal_dialer_http_client",
        statusCode: response.status,
      });
    }

    return normalizeDryRunResponse(request, payload);
  }

  public async dispatch(): Promise<never> {
    throw new Error("Live dispatch is disabled for staging internal dialer HTTP client.");
  }
}

export function parseAllowedStagingDialerBaseUrl(value: string): URL {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error("INTERNAL_DIALER_BASE_URL is required for staging dialer HTTP mode.");
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error("INTERNAL_DIALER_BASE_URL must be a valid URL.");
  }

  if (parsed.protocol !== "http:") {
    throw new Error("INTERNAL_DIALER_BASE_URL must use http for isolated staging.");
  }

  if (parsed.username || parsed.password) {
    throw new Error("INTERNAL_DIALER_BASE_URL must not contain credentials.");
  }

  if (!isAllowedStagingHost(parsed.hostname)) {
    throw new Error("INTERNAL_DIALER_BASE_URL must target loopback or hyperion-staging host.");
  }

  return parsed;
}

function isAllowedStagingHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "::1" ||
    host === "[::1]" ||
    host.startsWith("hyperion-staging-")
  );
}

function toHyperionDialerPayload(
  request: CedcoD02InternalDialerDryRunRequest,
): Readonly<Record<string, unknown>> {
  return {
    source: "hyperion-platform-staging",
    safe_contact_ref: request.safe_contact_ref,
    consent: { granted: request.consent.granted },
    consent_ref: request.consent_ref,
    ...(request.idempotency_key ? { idempotency_key: request.idempotency_key } : {}),
    ...(request.agent_alias ? { agent_ref: request.agent_alias } : {}),
    dynamic_variables: toStringDictionary(request.dynamic_vars),
    metadata: sanitizeMetadata({
      ...request.metadata,
      externalRequestId: request.external_request_id,
      runtimeMode: request.runtimeMode,
    }),
  };
}

function toStringDictionary(metadata: SafeMetadata | undefined): Readonly<Record<string, string>> {
  const entries = Object.entries(metadata ?? {}).flatMap(([key, value]) => {
    if (
      value === null ||
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      return [[key, String(value)] as const];
    }
    return [];
  });
  return Object.fromEntries(entries.slice(0, 20));
}

async function parseJsonResponse(response: StagingDialerFetchResponse): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    const text = await response.text();
    return { parse_error: "invalid_json", body_length: text.length };
  }
}

function normalizeDryRunResponse(
  request: CedcoD02InternalDialerDryRunRequest,
  payload: unknown,
): CedcoD02InternalDialerDryRunResult {
  if (!payload || typeof payload !== "object") {
    throw new Error("Dialer dry-run response must be an object.");
  }

  const record = payload as Record<string, unknown>;
  if (record.provider_egress !== false) {
    throw new Error("Dialer dry-run response failed provider egress guard.");
  }
  if (record.would_call_provider !== false) {
    throw new Error("Dialer dry-run response failed provider call guard.");
  }

  const status = record.status === "dry_run_accepted" ? "dry_run_accepted" : "blocked";
  return {
    status,
    idempotency_key: safeString(record.idempotency_key) ?? request.idempotency_key ?? "",
    internal_call_id:
      safeString(record.internal_call_id) ?? `blocked_${request.idempotency_key ?? "missing"}`,
    blocked_reasons: toBlockedReasons(record.blocked_reasons),
    would_call_provider: false,
    provider_egress: false,
    metadata: sanitizeMetadata({
      source: "staging_internal_dialer_http_client",
      ...(isRecord(record.metadata) ? record.metadata : {}),
    }),
  };
}

function blockedResult(
  request: CedcoD02InternalDialerDryRunRequest,
  reason: DialerBlockedReason,
  metadata: Readonly<Record<string, unknown>>,
): CedcoD02InternalDialerDryRunResult {
  return {
    status: "blocked",
    idempotency_key: request.idempotency_key ?? "",
    internal_call_id: `blocked_${request.idempotency_key ?? "missing"}`,
    blocked_reasons: [reason],
    would_call_provider: false,
    provider_egress: false,
    metadata: sanitizeMetadata(metadata),
  };
}

function toBlockedReasons(value: unknown): readonly DialerBlockedReason[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is DialerBlockedReason => typeof item === "string");
}

function safeString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
