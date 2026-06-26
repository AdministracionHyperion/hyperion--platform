export const forbiddenDatabaseFieldNames = [
  "phone",
  "phoneNumber",
  "toNumber",
  "to_number",
  "fromNumber",
  "from_number",
  "email",
  "documentNumber",
  "rawTranscript",
  "transcript",
  "audioUrl",
  "recordingUrl",
  "apiKey",
  "token",
  "secret",
  "password",
] as const;

export const forbiddenDatabaseScopeTerms = [
  ["R", "03"].join(""),
  "assets",
  ["activos", "fijos"].join("-"),
  ["activos", "fijos"].join("_"),
];
