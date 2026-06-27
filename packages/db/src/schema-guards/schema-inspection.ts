import { forbiddenDatabaseFieldNames, forbiddenDatabaseScopeTerms } from "./forbidden-fields";

export interface SchemaInspectionResult {
  readonly ok: boolean;
  readonly issues: readonly string[];
}

export function inspectSchemaText(
  schemaText: string,
  migrationText: string,
): SchemaInspectionResult {
  const issues: string[] = [];
  const combined = `${schemaText}\n${migrationText}`;

  for (const field of forbiddenDatabaseFieldNames) {
    const pattern = new RegExp(`["\\s]${escapeRegExp(field)}["\\s]`, "u");
    if (pattern.test(combined)) {
      issues.push(`forbidden database field detected: ${field}`);
    }
  }

  for (const term of forbiddenDatabaseScopeTerms) {
    if (combined.toLowerCase().includes(term.toLowerCase())) {
      issues.push(`forbidden database scope detected: ${term}`);
    }
  }

  if (combined.includes(["_", "private"].join(""))) {
    issues.push("database schema must not reference private documents");
  }

  return { ok: issues.length === 0, issues };
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}
