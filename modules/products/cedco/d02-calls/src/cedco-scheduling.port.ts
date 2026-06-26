import type { CedcoSchedulingRequest } from "./cedco-scheduling-request";

export interface CedcoSchedulingPort {
  requestScheduling(input: CedcoSchedulingRequest): Promise<CedcoSchedulingRequest>;
  cancelScheduling(input: CedcoSchedulingRequest): Promise<CedcoSchedulingRequest>;
  reschedule(input: CedcoSchedulingRequest): Promise<CedcoSchedulingRequest>;
}
