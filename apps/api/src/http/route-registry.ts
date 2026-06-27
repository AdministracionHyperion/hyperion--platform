import type { FastifyInstance } from "fastify";
import type { ApiServices } from "../services";
import { registerAgentPlatformRoutes } from "../routes/agent-platform.routes";
import { registerCedcoD02Routes } from "../routes/cedco-d02.routes";
import { registerCedcoD02MockRuntimeRoutes } from "../routes/cedco-d02-mock-runtime.routes";
import { registerCoreRoutes } from "../routes/core.routes";
import { registerHealthRoutes } from "../routes/health.routes";
import { registerVoiceRoutes } from "../routes/voice.routes";

export interface RouteRegistryDependencies {
  services: ApiServices;
}

export async function registerApiRoutes(
  app: FastifyInstance,
  dependencies: RouteRegistryDependencies,
): Promise<void> {
  await registerHealthRoutes(app);
  await registerCoreRoutes(app, dependencies);
  await registerAgentPlatformRoutes(app, dependencies);
  await registerVoiceRoutes(app, dependencies);
  await registerCedcoD02Routes(app, dependencies);
  await registerCedcoD02MockRuntimeRoutes(app, dependencies);
}
