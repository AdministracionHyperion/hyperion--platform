import type { JobHandlerPort } from "./job-handler.port";
import type { JobType } from "./job-type";

export class JobRegistry {
  private readonly handlers: JobHandlerPort[] = [];

  register(handler: JobHandlerPort): void {
    this.handlers.push(handler);
  }

  resolve(type: JobType): JobHandlerPort {
    const handler = this.handlers.find((candidate) => candidate.canHandle(type));
    if (!handler) {
      throw new Error(`No worker job handler registered for ${type}`);
    }
    return handler;
  }

  listHandlers(): readonly JobHandlerPort[] {
    return [...this.handlers];
  }
}
