import type { JobEnvelope } from "./job-envelope";
import type { JobResult } from "./job-result";
import type { JobType } from "./job-type";
import type { WorkerContext } from "./worker-context";

export interface JobHandlerPort {
  canHandle(type: JobType): boolean;
  handle(job: JobEnvelope, context: WorkerContext): Promise<JobResult>;
}
