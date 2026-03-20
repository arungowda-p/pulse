import { PrismaClient } from '@prisma/client';
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

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  if (globalForPrisma.prisma) return globalForPrisma.prisma;

  const databaseUrl = `file:${findDbFile()}`;
  const client = new PrismaClient({
    datasources: { db: { url: databaseUrl } },
  });

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
