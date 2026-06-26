import type {
  IntentEngineInput,
  IntentEnginePort,
  IntentEngineResult,
} from "../../../../modules/voice/call-orchestration/src/intent-engine.port";

export class FakeIntentEngine implements IntentEnginePort {
  constructor(
    private readonly result: IntentEngineResult = { objective: "faq", confidence: 0.9 },
  ) {}

  async detectIntent(_input: IntentEngineInput): Promise<IntentEngineResult> {
    return this.result;
  }
}
