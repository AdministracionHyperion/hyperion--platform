import type {
  ToolExecutionInput,
  ToolExecutionResult,
  ToolExecutorPort,
} from "../../../../modules/voice/call-orchestration/src/tool-executor.port";

export class FakeToolExecutor implements ToolExecutorPort {
  async executeTool(_input: ToolExecutionInput): Promise<ToolExecutionResult> {
    return { success: true, outputRedacted: "synthetic tool output" };
  }
}
