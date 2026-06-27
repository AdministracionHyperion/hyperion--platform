export interface CedcoNoClinicalTriageEvaluation {
  readonly allowed: boolean;
  readonly blockedReasons: readonly string[];
  readonly reasons: readonly string[];
}

const blockedPatterns: readonly [RegExp, string][] = [
  [/\bdiagn[oó]stic/iu, "no_diagnosis"],
  [/\btriage\b/iu, "no_clinical_triage"],
  [/\brecomiend(a|e|o)\b.*\bmedic/iu, "no_medical_recommendation"],
  [/\bresultado(s)?\b.*\bclin/iu, "no_clinical_result_reading"],
  [/\bhistoria\b.*\bclin/iu, "no_patient_record_exposure"],
  [/\bdecision(es)?\b.*\bclin/iu, "no_clinical_decision"],
];

export function evaluateCedcoNoClinicalTriagePolicy(
  textRedacted: string,
): CedcoNoClinicalTriageEvaluation {
  const blockedReasons = blockedPatterns
    .filter(([pattern]) => pattern.test(textRedacted))
    .map(([, reason]) => reason);

  return {
    allowed: blockedReasons.length === 0,
    blockedReasons,
    reasons: blockedReasons,
  };
}
