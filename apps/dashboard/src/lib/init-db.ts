import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

function resolvePaths() {
  const cwd = process.cwd();
  const candidates = [
    path.join(cwd, 'prisma'),
    path.join(cwd, 'apps', 'dashboard', 'prisma'),
  ];

  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, 'schema.prisma'))) {
      return {
        prismaDir: dir,
        schema: path.join(dir, 'schema.prisma'),
        db: path.join(dir, 'pgdev.db'),
        seed: path.join(dir, 'seed.ts'),
      };
    }
  }

  return {
    prismaDir: candidates[0],
    schema: path.join(candidates[0], 'schema.prisma'),
    db: path.join(candidates[0], 'pgdev.db'),
    seed: path.join(candidates[0], 'seed.ts'),
  };
}

export async function ensureDatabase() {
  const paths = resolvePaths();

  if (fs.existsSync(paths.db)) {
    return;
  }

  console.log('[pulse] Database not found at', paths.db);
  console.log('[pulse] Initializing database...');

  const dbUrl = `file:${paths.db.replace(/\\/g, '/')}`;
  const env = { ...process.env, DATABASE_URL: dbUrl };

  console.log('[pulse] Creating tables (prisma db push)...');
  execSync(
    `npx prisma db push --schema="${paths.schema}" --skip-generate --accept-data-loss`,
    { env, stdio: 'inherit' },
  );

  if (fs.existsSync(paths.seed)) {
    console.log('[pulse] Seeding initial data...');
    execSync(`npx tsx "${paths.seed}"`, { env, stdio: 'inherit' });
  }

  console.log('[pulse] Database ready.');
}
