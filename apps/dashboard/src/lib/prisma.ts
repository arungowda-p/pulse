import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

function findDbFile(): string {
  const candidates = [
    path.join(process.cwd(), 'prisma', 'pgdev.db'),
    path.join(process.cwd(), 'apps', 'dashboard', 'prisma', 'pgdev.db'),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p.replace(/\\/g, '/');
  }
  return candidates[0].replace(/\\/g, '/');
}

function findSchemaFile(): string {
  const candidates = [
    path.join(process.cwd(), 'prisma', 'schema.prisma'),
    path.join(process.cwd(), 'apps', 'dashboard', 'prisma', 'schema.prisma'),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return candidates[0];
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  if (globalForPrisma.prisma) return globalForPrisma.prisma;

  const databaseUrl = `file:${findDbFile()}`;
  let client: PrismaClient;
  try {
    client = new PrismaClient({
      datasources: { db: { url: databaseUrl } },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!message.includes('@prisma/client did not initialize yet')) {
      throw error;
    }

    const schema = findSchemaFile();
    execSync(`npx prisma generate --schema="${schema}"`, {
      stdio: 'inherit',
      env: process.env,
    });

    client = new PrismaClient({
      datasources: { db: { url: databaseUrl } },
    });
  }

  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = client;
  }
  return client;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = createPrismaClient();
    return Reflect.get(client, prop);
  },
});
