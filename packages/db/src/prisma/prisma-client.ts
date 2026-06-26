import { PrismaClient } from "@prisma/client";

export interface CreatePrismaClientOptions {
  readonly databaseUrl: string;
}

export function createPrismaClient(options: CreatePrismaClientOptions): PrismaClient {
  if (options.databaseUrl.trim().length === 0) {
    throw new Error("databaseUrl is required to create PrismaClient");
  }

  return new PrismaClient({
    datasources: {
      db: {
        url: options.databaseUrl,
      },
    },
  });
}
