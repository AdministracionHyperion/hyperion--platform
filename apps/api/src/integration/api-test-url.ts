export function getApiIntegrationDatabaseUrl(): string | undefined {
  return process.env.DATABASE_URL;
}
