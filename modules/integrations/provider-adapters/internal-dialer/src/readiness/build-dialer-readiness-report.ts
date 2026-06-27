import {
  defaultDialerHardeningStatus,
  type DialerHardeningStatus,
} from "../dialer-hardening-status";
import { buildDialerHardeningChecklist } from "./dialer-hardening-checklist";
import { scoreDialerReadiness } from "./dialer-readiness-score";
import { summarizeDialerReadiness } from "./dialer-readiness-summary";

export interface DialerReadinessReport {
  readonly adapter: "internal-dialer";
  readonly mode: "blocked-contract";
  readonly hardeningStatus: DialerHardeningStatus;
  readonly checklist: ReturnType<typeof buildDialerHardeningChecklist>;
  readonly score: ReturnType<typeof scoreDialerReadiness>;
  readonly summary: ReturnType<typeof summarizeDialerReadiness>;
  readonly prohibitedTargets: readonly string[];
}

export function buildDialerReadinessReport(
  hardeningStatus: DialerHardeningStatus = defaultDialerHardeningStatus,
): DialerReadinessReport {
  const checklist = buildDialerHardeningChecklist(hardeningStatus);
  const score = scoreDialerReadiness(checklist);
  const summary = summarizeDialerReadiness({ hardeningStatus, checklist, score });

  return {
    adapter: "internal-dialer",
    mode: "blocked-contract",
    hardeningStatus,
    checklist,
    score,
    summary,
    prohibitedTargets: [
      "dialer-demo-call",
      "dialer-campaign-start",
      "elevenlabs-direct",
      "sip-direct",
      "twilio-direct",
      "provider-egress",
      "real-call-dispatch",
    ],
  };
}
