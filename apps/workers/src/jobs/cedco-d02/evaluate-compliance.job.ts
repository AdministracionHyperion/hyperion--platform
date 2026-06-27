import { evaluateCedcoCompliance } from "../../../../../modules/products/cedco/d02-calls/src";
import type { CedcoCallIntent } from "../../../../../modules/products/cedco/d02-calls/src";
import { createJobSuccess } from "../../core";
import type { JobEnvelope, JobHandlerPort, JobResult, JobType, WorkerContext } from "../../core";

export function createEvaluateComplianceJobHandler(): JobHandlerPort {
  return {
    canHandle(type: JobType): boolean {
      return type === "cedco_d02.compliance.evaluate";
    },

    async handle(job: JobEnvelope, _context: WorkerContext): Promise<JobResult> {
      const evaluation = evaluateCedcoCompliance({
        textRedacted: readString(job.payload.textRedacted) ?? readString(job.payload.text),
        intent: readIntent(job.payload.intent),
        metadata: job.payload,
        optOut: job.payload.optOut === true,
      });

      return createJobSuccess({
        jobId: job.jobId,
        output: evaluation.ok ? { ...evaluation.value } : { blocked: true },
        metadata: { jobType: job.type },
      });
    },
  };
}

function readString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

const cedcoIntents = new Set<CedcoCallIntent>([
  "consultar_sede",
  "consultar_horario",
  "consultar_servicio",
  "consultar_convenio",
  "agendar",
  "reagendar",
  "cancelar",
  "orientacion_general",
  "solicitar_humano",
  "opt_out",
  "urgencia",
  "desconocida",
]);

function readIntent(value: unknown): CedcoCallIntent | undefined {
  return typeof value === "string" && cedcoIntents.has(value as CedcoCallIntent)
    ? (value as CedcoCallIntent)
    : undefined;
}
