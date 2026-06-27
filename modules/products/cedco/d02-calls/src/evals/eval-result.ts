import type { CedcoD02EvalCaseId } from "./eval-case-id";
import type { CedcoD02EvalCaseType } from "./eval-case-type";
import type { CedcoD02EvalCaseSeverity } from "./eval-severity";

export interface CedcoD02EvalResult {
  readonly caseId: CedcoD02EvalCaseId;
  readonly type: CedcoD02EvalCaseType;
  readonly severity: CedcoD02EvalCaseSeverity;
  readonly name: string;
  readonly passed: boolean;
  readonly score: number;
  readonly failures: readonly string[];
  readonly warnings: readonly string[];
  readonly metadata: Readonly<Record<string, unknown>>;
}
