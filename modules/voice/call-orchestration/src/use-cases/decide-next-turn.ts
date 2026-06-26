import { ok, sanitizeMetadata, type Result } from "../../../../../packages/shared/src/core";
import type { IntentEnginePort } from "../intent-engine.port";
import type { ResponseGeneratorPort } from "../response-generator.port";
import type { TurnDecision } from "../turn-decision";
import type { CallContext } from "../call-context";

export interface DecideNextTurnInput {
  readonly callContext: CallContext;
  readonly textRedacted: string;
  readonly intentEngine: IntentEnginePort;
  readonly responseGenerator: ResponseGeneratorPort;
}

export async function decideNextTurn(
  input: DecideNextTurnInput,
): Promise<Result<TurnDecision, never>> {
  const intent = await input.intentEngine.detectIntent({
    textRedacted: input.textRedacted,
    context: input.callContext,
  });

  if (intent.shouldHandoff || intent.objective === "handoff") {
    return ok({
      action: "handoff",
      handoffReason: "intent_policy",
      metadata: sanitizeMetadata({ objective: intent.objective, confidence: intent.confidence }),
    });
  }

  const responseTextRedacted = await input.responseGenerator.generateResponse({
    context: input.callContext,
    intent,
  });

  return ok({
    action: "respond",
    responseTextRedacted,
    metadata: sanitizeMetadata({ objective: intent.objective, confidence: intent.confidence }),
  });
}
