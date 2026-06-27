import {
  domainError,
  fail,
  isSensitiveMetadataKey,
  ok,
  type DomainError,
  type Result,
} from "../../../../../packages/shared/src/core";
import type { PromptVersion } from "../prompt-version";

export interface RenderPromptPreviewInput {
  readonly promptVersion: PromptVersion;
  readonly values: Readonly<Record<string, string>>;
}

export function renderPromptPreview(input: RenderPromptPreviewInput): Result<string, DomainError> {
  for (const key of Object.keys(input.values)) {
    if (isSensitiveMetadataKey(key)) {
      return fail(
        domainError("invalid_metadata", "prompt preview values contain sensitive metadata"),
      );
    }
  }

  let rendered = input.promptVersion.template;
  for (const variable of input.promptVersion.variables) {
    const value = input.values[variable.name] ?? variable.defaultValue;

    if (variable.required && value === undefined) {
      return fail(domainError("invalid_state", `missing prompt variable ${variable.name}`));
    }

    rendered = rendered.replaceAll(`{{${variable.name}}}`, value ?? "");
  }

  return ok(rendered);
}
