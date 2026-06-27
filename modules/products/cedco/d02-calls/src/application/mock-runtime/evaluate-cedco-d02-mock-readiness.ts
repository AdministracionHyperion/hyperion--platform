import { ok, type Result } from "../../../../../../../packages/shared/src/core";
import { findForbiddenRuntimeKey } from "../../../../../../voice/call-runtime/src";
import type { CedcoD02MockCallIntent } from "./build-cedco-d02-mock-call-intent";

export interface CedcoD02MockReadiness {
  readonly ready: boolean;
  readonly blockingReasons: readonly string[];
  readonly runtimeMode: "mock";
}

export function evaluateCedcoD02MockReadiness(
  intent: CedcoD02MockCallIntent,
): Result<CedcoD02MockReadiness, never> {
  const reasons = new Set<string>();

  if (!intent.tenantId) reasons.add("missing_tenant");
  if (!intent.actorId) reasons.add("missing_actor");
  if (!intent.correlationId) reasons.add("missing_correlation");
  if (!intent.consentRef) reasons.add("missing_consent_ref");
  if (!intent.safeContactRef) reasons.add("missing_safe_contact_ref");
  if (looksLikePhone(intent.safeContactRef)) reasons.add("phone_real_blocked");
  if (findForbiddenRuntimeKey(intent.metadata)) reasons.add("unsafe_metadata");
  if (intent.objective === "unknown") reasons.add("unknown_objective");
  if (
    String(intent.metadata.intent ?? "")
      .toLowerCase()
      .includes("diagnost")
  ) {
    reasons.add("diagnostic_intent_blocked");
  }

  return ok({
    ready: reasons.size === 0,
    blockingReasons: [...reasons],
    runtimeMode: "mock",
  });
}

function looksLikePhone(value: string): boolean {
  return value.includes("+") || /\d{7,}/u.test(value) || /phone|tel|celular/iu.test(value);
}
