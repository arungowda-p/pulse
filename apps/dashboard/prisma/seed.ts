import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';

const schemaDir = path.resolve(__dirname);
const dbFile = path.join(schemaDir, 'pgdev.db');

if (!fs.existsSync(dbFile)) {
  console.error('Database file not found at:', dbFile);
  process.exit(1);
}

process.env.DATABASE_URL = `file:${dbFile}`;
const prisma = new PrismaClient();

async function main() {
  const project = await prisma.project.upsert({
    where: { slug: 'pulse-demo' },
    update: {},
    create: { name: 'Pulse Demo', slug: 'pulse-demo' },
  });
  console.log(`Project: ${project.name} (${project.slug})`);

  /* ── Environments ───────────────────────────────────── */

  const envDefs = [
    { name: 'Production', slug: 'production' },
    { name: 'Staging', slug: 'staging' },
  ];
  const envIds: Record<string, string> = {};

  for (const def of envDefs) {
    const env = await prisma.environment.upsert({
      where: {
        projectId_slug: { projectId: project.id, slug: def.slug },
      },
      update: {},
      create: { ...def, projectId: project.id },
    });
    envIds[def.slug] = env.id;
    console.log(`  Env: ${def.name} (${def.slug})`);
  }

  /* ── Clients (per-environment) ──────────────────────── */

  const clientDefs = [
    { env: 'production', name: 'Web App' },
    { env: 'production', name: 'Mobile App' },
    { env: 'production', name: 'API Server' },
    { env: 'staging', name: 'Staging App' },
  ];
  const clientIds: Record<string, string> = {};

  for (const def of clientDefs) {
    const environmentId = envIds[def.env];
    const client = await prisma.client.upsert({
      where: {
        environmentId_name: { environmentId, name: def.name },
      },
      update: {},
      create: { name: def.name, environmentId },
    });
    clientIds[`${def.env}/${def.name}`] = client.id;
    console.log(`  Client: ${def.name} (in ${def.env})`);
  }

  /* ── Flags ──────────────────────────────────────────── */

  const flagDefs = [
    { key: 'new-checkout', name: 'New Checkout Flow', description: 'Enable the redesigned checkout experience', on: false },
    { key: 'dark-mode', name: 'Dark Mode', description: 'Application-wide dark colour scheme', on: false },
    { key: 'promo-banner', name: 'Promo Banner', description: 'Show promotional banner at the top of the page', on: false },
    { key: 'maintenance-mode', name: 'Maintenance Mode', description: 'Show maintenance overlay, blocking all interactions', on: false },
    { key: 'user-feedback', name: 'Feedback Widget', description: 'Floating widget for collecting user feedback', on: false },
  ];
  const flagIds: Record<string, string> = {};

  for (const def of flagDefs) {
    const flag = await prisma.flag.upsert({
      where: { projectId_key: { projectId: project.id, key: def.key } },
      update: {},
      create: { ...def, projectId: project.id },
    });
    flagIds[def.key] = flag.id;
    console.log(`  Flag: ${def.key}`);
  }

  /* ── Environment overrides ──────────────────────────── */

  const envOverrides = [
    { env: 'production', flag: 'dark-mode', on: true },
    { env: 'staging', flag: 'maintenance-mode', on: true },
  ];

  for (const o of envOverrides) {
    const environmentId = envIds[o.env];
    const flagId = flagIds[o.flag];
    await prisma.envFlagOverride.upsert({
      where: {
        environmentId_flagId: { environmentId, flagId },
      },
      update: { on: o.on },
      create: { environmentId, flagId, on: o.on },
    });
    console.log(`  Env override: ${o.env} → ${o.flag} = ${o.on}`);
  }

  /* ── Client overrides ───────────────────────────────── */

  const clientOverrides = [
    { client: 'production/Web App', flag: 'promo-banner', on: true },
    { client: 'production/Mobile App', flag: 'new-checkout', on: true },
  ];

  for (const o of clientOverrides) {
    const clientId = clientIds[o.client];
    const flagId = flagIds[o.flag];
    await prisma.clientFlagOverride.upsert({
      where: { clientId_flagId: { clientId, flagId } },
      update: { on: o.on },
      create: { clientId, flagId, on: o.on },
    });
    console.log(`  Client override: ${o.client} → ${o.flag} = ${o.on}`);
  }

  console.log('Seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
