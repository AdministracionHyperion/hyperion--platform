export type PromptVariablePiiRisk = "none" | "low" | "medium" | "high";

export interface PromptVariable {
  readonly name: string;
  readonly required: boolean;
  readonly description: string;
  readonly defaultValue?: string;
  readonly piiRisk: PromptVariablePiiRisk;
}
