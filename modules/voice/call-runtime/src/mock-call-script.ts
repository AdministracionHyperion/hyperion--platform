import type { SafeMetadata } from "../../../../packages/shared/src/core";

export interface MockCallScript {
  readonly scriptId: string;
  readonly objective: string;
  readonly syntheticUserIntent: string;
  readonly safePrompt: string;
  readonly safeSummary: string;
  readonly metadata: SafeMetadata;
}

export function createDefaultMockCallScript(scriptId = "cedco-d02-default-mock"): MockCallScript {
  return {
    scriptId,
    objective: "orientation",
    syntheticUserIntent: "consultar_sede",
    safePrompt: "Orientacion general CEDCO D02 simulada.",
    safeSummary: "Interaccion mock completada con informacion segura y sin llamada real.",
    metadata: {},
  };
}
