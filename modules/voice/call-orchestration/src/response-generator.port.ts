import type { CallContext } from "./call-context";
import type { IntentEngineResult } from "./intent-engine.port";

export interface ResponseGeneratorInput {
  readonly context: CallContext;
  readonly intent: IntentEngineResult;
}

export interface ResponseGeneratorPort {
  generateResponse(input: ResponseGeneratorInput): Promise<string>;
}
