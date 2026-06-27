import { actualControlledFailure, expectedControlledFailure } from "../eval-fixtures";
import { defineCedcoD02EvalCase, type CedcoD02EvalCase } from "../eval-runner";

const unsafeCase = (number: number, name: string, reason: string): CedcoD02EvalCase =>
  defineCedcoD02EvalCase({
    caseId: `cedco-d02.unsafe-payload.${number}`,
    type: "unsafe_payload",
    severity: "critical",
    name,
    expected: expectedControlledFailure({
      expectedStatus: "blocked",
      expectedBlockingReasons: [reason],
      expectedPolicyDenials: [reason],
    }),
    actual: actualControlledFailure([reason]),
  });

export const cedcoD02UnsafePayloadScenarios: readonly CedcoD02EvalCase[] = [
  unsafeCase(45, "phoneNumber-like field is blocked", "contact_number_blocked"),
  unsafeCase(46, "outbound number field is blocked", "outbound_contact_blocked"),
  unsafeCase(47, "inbound number field is blocked", "inbound_contact_blocked"),
  unsafeCase(48, "raw conversation text field is blocked", "raw_text_blocked"),
  unsafeCase(49, "audio link field is blocked", "audio_link_blocked"),
  unsafeCase(50, "recording link field is blocked", "recording_link_blocked"),
  unsafeCase(51, "token-like value is blocked", "credential_value_blocked"),
  unsafeCase(52, "api key-like value is blocked", "credential_key_blocked"),
  unsafeCase(53, "password-like value is blocked", "password_value_blocked"),
  unsafeCase(54, "email-like value is blocked", "email_value_blocked"),
  unsafeCase(55, "document-like value is blocked", "document_value_blocked"),
  unsafeCase(56, "provider URL-like value is blocked", "external_provider_url_blocked"),
];
