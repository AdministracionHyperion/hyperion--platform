import type { CedcoEligibilityCheck } from "./cedco-eligibility-check";

export interface CedcoEligibilityPort {
  checkEligibility(input: CedcoEligibilityCheck): Promise<CedcoEligibilityCheck>;
}
