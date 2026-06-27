import type { ActorContext } from "../../../../modules/core/identity-access/src";
import {
  evaluateRuntimeActionPolicy,
  type RuntimeSafetyFlags,
  type PolicyGateAction,
  type PolicyGateResult,
} from "../../../../modules/core/policy-gates/src";
import type { OperationContext } from "../../../../packages/shared/src/core";
import {
  metricNames,
  sanitizeLogMetadata,
  type LoggerPort,
  type MetricsRegistryPort,
} from "../../../../packages/observability/src";
import type { JobEnvelope } from "./job-envelope";

export interface WorkerSafetyEvaluation {
  readonly allowed: boolean;
  readonly reasons: readonly string[];
  readonly policyResults: readonly PolicyGateResult[];
}

const dangerousPayloadKeys = new Map<string, PolicyGateAction>([
  ["realCallsEnabled", "call.real_call.enable"],
  ["providerEgressEnabled", "provider.egress"],
  ["productionDeployEnabled", "production.deploy"],
  ["rawTranscriptEnabled", "raw_transcript.enable"],
  ["rawRecordingEnabled", "raw_recording.enable"],
  ["dataExportEnabled", "data.export"],
  ["rawTranscript", "raw_transcript.enable"],
  ["audioUrl", "raw_recording.enable"],
  ["recordingUrl", "raw_recording.enable"],
  ["phoneNumber", "data.export"],
  ["to_number", "data.export"],
  ["secret", "provider.egress"],
  ["token", "provider.egress"],
  ["apiKey", "provider.egress"],
  ["password", "provider.egress"],
]);

export function evaluateWorkerRuntimeSafety(input: {
  readonly job: JobEnvelope;
  readonly context: OperationContext;
  readonly actor: ActorContext;
  readonly flags: RuntimeSafetyFlags;
  readonly logger?: LoggerPort;
  readonly metrics?: MetricsRegistryPort;
}): WorkerSafetyEvaluation {
  const actions = actionsFromPayload(input.job.payload);
  const policyResults = actions.map((action) =>
    evaluateRuntimeActionPolicy({
      context: input.context,
      actor: input.actor,
      action,
      flags: input.flags,
      metadata: {
        jobId: input.job.jobId,
        jobType: input.job.type,
        payload: input.job.payload,
      },
      logger: input.logger,
      metrics: input.metrics,
    }),
  );
  const denied = policyResults.filter((result) => !result.allowed);

  if (denied.length > 0) {
    input.metrics?.increment(metricNames.workerPolicyDeniedTotal, { jobType: input.job.type });
    input.logger?.warn({
      message: "worker.policy.denied",
      eventName: "worker.policy.denied",
      tenantId: input.job.tenantId,
      actorId: input.job.actorId,
      correlationId: input.job.correlationId,
      metadata: sanitizeLogMetadata({
        jobId: input.job.jobId,
        jobType: input.job.type,
        reasons: denied.flatMap((result) => result.reasons),
      }),
    });
  }

  return {
    allowed: denied.length === 0,
    reasons: denied.flatMap((result) => result.reasons),
    policyResults,
  };
}

function actionsFromPayload(payload: unknown): PolicyGateAction[] {
  const actions = new Set<PolicyGateAction>();
  walkPayload(payload, (key, value) => {
    const action = dangerousPayloadKeys.get(key);
    if (!action) {
      return;
    }

    if (typeof value === "boolean" && value === false) {
      return;
    }

    actions.add(action);
  });
  return [...actions];
}

function walkPayload(value: unknown, visitor: (key: string, value: unknown) => void): void {
  if (Array.isArray(value)) {
    for (const item of value) {
      walkPayload(item, visitor);
    }
    return;
  }

  if (value && typeof value === "object") {
    for (const [key, nestedValue] of Object.entries(value as Record<string, unknown>)) {
      visitor(key, nestedValue);
      walkPayload(nestedValue, visitor);
    }
  }
}
