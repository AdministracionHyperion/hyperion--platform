import { createApiApp } from "./app";
import { createApiServicesFromConfig } from "./composition";
import { loadApiConfig } from "./config/api-config";

export async function startApiServer(): Promise<void> {
  const config = loadApiConfig();
  const runtime = createApiServicesFromConfig(config);
  const app = await createApiApp({
    services: runtime.services,
    authMode: config.authMode,
    authReference: config.authReference,
  });
  app.addHook("onClose", async () => {
    await runtime.close();
  });
  await app.listen({ host: config.host, port: config.port });
}
