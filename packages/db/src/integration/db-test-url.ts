interface IntegrationTestProcess {
  readonly env: Readonly<Record<string, string | undefined>>;
}

declare const process: IntegrationTestProcess | undefined;

export const syntheticIntegrationDatabaseUrl =
  "postgresql://hyperion_test:hyperion_test@localhost:5432/hyperion_test?schema=public";

export function getIntegrationDatabaseUrl(): string | null {
  const value = process?.env.DATABASE_URL?.trim();
  return value && value.length > 0 ? value : null;
}
