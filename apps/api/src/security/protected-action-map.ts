import type { FastifyRequest } from "fastify";
import type { PolicyGateAction } from "../../../../modules/core/policy-gates/src";

export interface ProtectedActionMatch {
  readonly action: PolicyGateAction;
  readonly reason: string;
}

export function findProtectedAction(request: FastifyRequest): ProtectedActionMatch | undefined {
  const body = isRecord(request.body) ? request.body : {};
  const route = (request.routeOptions.url ?? request.url).toLowerCase();

  const directFlag = findEnabledRuntimeFlag(body);
  if (directFlag) {
    return directFlag;
  }

  if (
    route.endsWith("/products/cedco/d02/configuration") &&
    request.method === "PUT" &&
    body.schedulingMode === "integration"
  ) {
    return {
      action: "cedco.d02.scheduling.integration.enable",
      reason: "CEDCO D02 scheduling integration is blocked by default.",
    };
  }

  if (
    route.endsWith("/products/cedco/d02/configuration") &&
    request.method === "PUT" &&
    body.eligibilityMode === "integration"
  ) {
    return {
      action: "cedco.d02.eligibility.integration.enable",
      reason: "CEDCO D02 eligibility integration is blocked by default.",
    };
  }

  if (route.includes("/dispatch")) {
    return {
      action: "call.dispatch",
      reason: "Real call dispatch routes are blocked.",
    };
  }

  return undefined;
}

function findEnabledRuntimeFlag(
  body: Readonly<Record<string, unknown>>,
): ProtectedActionMatch | undefined {
  if (body.realCallsEnabled === true) {
    return {
      action: "cedco.d02.real_calls.enable",
      reason: "Real calls are blocked by default.",
    };
  }
  if (body.providerEgressEnabled === true) {
    return {
      action: "provider.egress",
      reason: "Provider egress is blocked by default.",
    };
  }
  if (body.productionDeployEnabled === true) {
    return {
      action: "production.deploy",
      reason: "Production deploy is blocked by default.",
    };
  }
  if (body.rawTranscriptEnabled === true) {
    return {
      action: "raw_transcript.enable",
      reason: "Raw transcript capture is blocked by default.",
    };
  }
  if (body.rawRecordingEnabled === true) {
    return {
      action: "raw_recording.enable",
      reason: "Raw recording capture is blocked by default.",
    };
  }
  if (body.dataExportEnabled === true) {
    return {
      action: "data.export",
      reason: "Data export is blocked by default.",
    };
  }

  return undefined;
}

export function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
