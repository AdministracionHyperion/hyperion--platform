import type {
  ResponseGeneratorInput,
  ResponseGeneratorPort,
} from "../../../../modules/voice/call-orchestration/src/response-generator.port";

export class FakeResponseGenerator implements ResponseGeneratorPort {
  constructor(private readonly response = "synthetic redacted response") {}

  async generateResponse(_input: ResponseGeneratorInput): Promise<string> {
    return this.response;
  }
}
