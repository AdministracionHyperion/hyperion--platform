import { z } from "zod";

const apiConfigSchema = z.object({
  API_HOST: z.string().default("127.0.0.1"),
  API_PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1).optional(),
  NODE_ENV: z.string().default("development"),
});

export interface ApiConfig {
  readonly host: string;
  readonly port: number;
  readonly databaseUrl?: string;
  readonly nodeEnv: string;
}

export function loadApiConfig(env: NodeJS.ProcessEnv = process.env): ApiConfig {
  const parsed = apiConfigSchema.parse(env);
  return {
    host: parsed.API_HOST,
    port: parsed.API_PORT,
    ...(parsed.DATABASE_URL ? { databaseUrl: parsed.DATABASE_URL } : {}),
    nodeEnv: parsed.NODE_ENV,
  };
}
