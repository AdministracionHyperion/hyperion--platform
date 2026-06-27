import type {
  CedcoEligibilityCheck,
  CedcoEligibilityPort,
} from "../../../../../../modules/products/cedco/d02-calls/src";

export class FakeCedcoEligibility implements CedcoEligibilityPort {
  readonly checks: CedcoEligibilityCheck[] = [];

  async checkEligibility(input: CedcoEligibilityCheck): Promise<CedcoEligibilityCheck> {
    this.checks.push(input);
    return input;
  }
}
