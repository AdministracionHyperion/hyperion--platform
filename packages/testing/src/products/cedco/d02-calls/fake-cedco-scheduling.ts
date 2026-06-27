import type {
  CedcoSchedulingPort,
  CedcoSchedulingRequest,
} from "../../../../../../modules/products/cedco/d02-calls/src";

export class FakeCedcoScheduling implements CedcoSchedulingPort {
  readonly requests: CedcoSchedulingRequest[] = [];

  async requestScheduling(input: CedcoSchedulingRequest): Promise<CedcoSchedulingRequest> {
    this.requests.push(input);
    return input;
  }

  async cancelScheduling(input: CedcoSchedulingRequest): Promise<CedcoSchedulingRequest> {
    return { ...input, status: "oriented" };
  }

  async reschedule(input: CedcoSchedulingRequest): Promise<CedcoSchedulingRequest> {
    return { ...input, status: "integration_required" };
  }
}
