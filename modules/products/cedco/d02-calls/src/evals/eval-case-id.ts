import { fail, ok, type Result } from "../../../../../../packages/shared/src/core";

export type CedcoD02EvalCaseId = `cedco-d02.${string}.${number}`;

const evalCaseIdPattern = /^cedco-d02\.[a-z][a-z0-9-]*\.[0-9]+$/u;

export function createCedcoD02EvalCaseId(value: string): Result<CedcoD02EvalCaseId, string> {
  const normalized = value.trim();
  if (!evalCaseIdPattern.test(normalized)) {
    return fail("eval case id must match cedco-d02.<category>.<number>");
  }
  return ok(normalized as CedcoD02EvalCaseId);
}

export function isCedcoD02EvalCaseId(value: string): value is CedcoD02EvalCaseId {
  return evalCaseIdPattern.test(value);
}
