import { type SafeMetadata } from "../../../../packages/shared/src/core";
import type { CallContext } from "./call-context";

export interface ToolExecutionInput {
  readonly context: CallContext;
  readonly toolName: string;
  readonly metadata?: SafeMetadata;
}

export interface ToolExecutionResult {
  readonly success: boolean;
  readonly outputRedacted?: string;
}

export interface ToolExecutorPort {
  executeTool(input: ToolExecutionInput): Promise<ToolExecutionResult>;
}
