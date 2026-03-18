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

const databaseUrl = `file:${findDbFile()}`;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: { db: { url: databaseUrl } },
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
