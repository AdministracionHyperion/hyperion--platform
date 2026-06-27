import { createApiApp } from "./app";
import { loadApiConfig } from "./config/api-config";

export async function startApiServer(): Promise<void> {
  const config = loadApiConfig();
  const app = await createApiApp();
  await app.listen({ host: config.host, port: config.port });
}
