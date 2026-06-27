import type { SafeMetadata } from "../../../../packages/shared/src/core";

export interface MockPostCallResult {
  readonly outcome: "completed" | "handoff_recommended" | "blocked";
  readonly detectedIntent: string;
  readonly disposition: "resolved_mock" | "needs_handoff_mock" | "blocked_mock";
  readonly safeSummary: string;
  readonly nextRecommendedAction: string;
  readonly handoffRecommended: boolean;
  readonly auditNotes: readonly string[];
  readonly metrics: SafeMetadata;
}
