import { prisma } from './prisma';
import { notifyProjectFlagChange } from './flag-events';
import { sendFlagChangedWebhook } from './outbound-webhook';
import type { Flag, FlagWithOverrides } from '../types/flag';

function emitFlagChange(projectSlug: string, flagKey?: string) {
  notifyProjectFlagChange(projectSlug, flagKey);
  void sendFlagChangedWebhook(projectSlug, flagKey).catch((error) => {
    console.error('[pulse] outbound webhook failed:', error);
  });
}

function serialize(row: {
  id: string;
  key: string;
  name: string;
  description: string;
  on: boolean;
  projectId: string;
  createdAt: Date;
  updatedAt: Date;
  overrides?: { clientId: string; on: boolean }[];
  envOverrides?: { environmentId: string; on: boolean }[];
}): Flag | FlagWithOverrides {
  const base: Flag = {
    id: row.id,
    key: row.key,
    name: row.name,
    description: row.description,
    on: row.on,
    projectId: row.projectId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
  if (row.overrides || row.envOverrides) {
    return {
      ...base,
      overrides: (row.overrides || []).map((o) => ({
        clientId: o.clientId,
        on: o.on,
      })),
      envOverrides: (row.envOverrides || []).map((o) => ({
        environmentId: o.environmentId,
        on: o.on,
      })),
    } as FlagWithOverrides;
  }
  return base;
}

export async function getFlagsForProject(
  projectSlug: string,
): Promise<FlagWithOverrides[]> {
  const project = await prisma.project.findUnique({
    where: { slug: projectSlug },
    select: { id: true },
  });
  if (!project) return [];

  const rows = await prisma.flag.findMany({
    where: { projectId: project.id },
    include: {
      overrides: { select: { clientId: true, on: true } },
      envOverrides: { select: { environmentId: true, on: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });
  return rows.map(serialize) as FlagWithOverrides[];
}

export async function getFlag(
  projectSlug: string,
  key: string,
): Promise<FlagWithOverrides | null> {
  const project = await prisma.project.findUnique({
    where: { slug: projectSlug },
    select: { id: true },
  });
  if (!project) return null;

  const row = await prisma.flag.findUnique({
    where: { projectId_key: { projectId: project.id, key } },
    include: {
      overrides: { select: { clientId: true, on: true } },
      envOverrides: { select: { environmentId: true, on: true } },
    },
  });
  return row ? (serialize(row) as FlagWithOverrides) : null;
}

export async function createFlag(
  projectSlug: string,
  data: { key: string; name?: string; description?: string },
): Promise<Flag | { error: string; status: number }> {
  const k = (data.key || '').trim().toLowerCase().replace(/\s+/g, '-');
  if (!k) return { error: 'Flag key is required', status: 400 };

  const project = await prisma.project.findUnique({
    where: { slug: projectSlug },
    select: { id: true },
  });
  if (!project) return { error: 'Project not found', status: 404 };

  const existing = await prisma.flag.findUnique({
    where: { projectId_key: { projectId: project.id, key: k } },
  });
  if (existing)
    return { error: 'Flag key already exists in this project', status: 409 };

  const row = await prisma.flag.create({
    data: {
      key: k,
      name: data.name || k,
      description: data.description || '',
      projectId: project.id,
    },
  });
  emitFlagChange(projectSlug, k);
  return serialize(row) as Flag;
}

export async function updateFlag(
  projectSlug: string,
  key: string,
  data: { name?: string; description?: string; on?: boolean },
): Promise<Flag | null> {
  const project = await prisma.project.findUnique({
    where: { slug: projectSlug },
    select: { id: true },
  });
  if (!project) return null;

  try {
    const row = await prisma.flag.update({
      where: { projectId_key: { projectId: project.id, key } },
      data: {
        ...(typeof data.name !== 'undefined' && { name: data.name }),
        ...(typeof data.description !== 'undefined' && {
          description: data.description,
        }),
        ...(typeof data.on === 'boolean' && { on: data.on }),
      },
    });
    emitFlagChange(projectSlug, key);
    return serialize(row) as Flag;
  } catch {
    return null;
  }
}

export async function deleteFlag(
  projectSlug: string,
  key: string,
): Promise<boolean> {
  const project = await prisma.project.findUnique({
    where: { slug: projectSlug },
    select: { id: true },
  });
  if (!project) return false;

  try {
    await prisma.flag.delete({
      where: { projectId_key: { projectId: project.id, key } },
    });
    emitFlagChange(projectSlug, key);
    return true;
  } catch {
    return false;
  }
}

/* ── Client overrides ─────────────────────────────────── */

export async function setOverride(
  projectSlug: string,
  flagKey: string,
  clientId: string,
  on: boolean,
): Promise<{ clientId: string; on: boolean } | null> {
  const project = await prisma.project.findUnique({
    where: { slug: projectSlug },
    select: { id: true },
  });
  if (!project) return null;

  const flag = await prisma.flag.findUnique({
    where: { projectId_key: { projectId: project.id, key: flagKey } },
    select: { id: true },
  });
  if (!flag) return null;

  const row = await prisma.clientFlagOverride.upsert({
    where: { clientId_flagId: { clientId, flagId: flag.id } },
    update: { on },
    create: { clientId, flagId: flag.id, on },
  });
  emitFlagChange(projectSlug, flagKey);
  return { clientId: row.clientId, on: row.on };
}

export async function removeOverride(
  projectSlug: string,
  flagKey: string,
  clientId: string,
): Promise<boolean> {
  const project = await prisma.project.findUnique({
    where: { slug: projectSlug },
    select: { id: true },
  });
  if (!project) return false;

  const flag = await prisma.flag.findUnique({
    where: { projectId_key: { projectId: project.id, key: flagKey } },
    select: { id: true },
  });
  if (!flag) return false;

  try {
    await prisma.clientFlagOverride.delete({
      where: { clientId_flagId: { clientId, flagId: flag.id } },
    });
    emitFlagChange(projectSlug, flagKey);
    return true;
  } catch {
    return false;
  }
}

/* ── Environment overrides ────────────────────────────── */

export async function setEnvOverride(
  projectSlug: string,
  flagKey: string,
  environmentId: string,
  on: boolean,
): Promise<{ environmentId: string; on: boolean } | null> {
  const project = await prisma.project.findUnique({
    where: { slug: projectSlug },
    select: { id: true },
  });
  if (!project) return null;

  const flag = await prisma.flag.findUnique({
    where: { projectId_key: { projectId: project.id, key: flagKey } },
    select: { id: true },
  });
  if (!flag) return null;

  const row = await prisma.envFlagOverride.upsert({
    where: {
      environmentId_flagId: { environmentId, flagId: flag.id },
    },
    update: { on },
    create: { environmentId, flagId: flag.id, on },
  });
  emitFlagChange(projectSlug, flagKey);
  return { environmentId: row.environmentId, on: row.on };
}

export async function removeEnvOverride(
  projectSlug: string,
  flagKey: string,
  environmentId: string,
): Promise<boolean> {
  const project = await prisma.project.findUnique({
    where: { slug: projectSlug },
    select: { id: true },
  });
  if (!project) return false;

  const flag = await prisma.flag.findUnique({
    where: { projectId_key: { projectId: project.id, key: flagKey } },
    select: { id: true },
  });
  if (!flag) return false;

  try {
    await prisma.envFlagOverride.delete({
      where: {
        environmentId_flagId: { environmentId, flagId: flag.id },
      },
    });
    emitFlagChange(projectSlug, flagKey);
    return true;
  } catch {
    return false;
  }
}

/* ── Evaluation (3-tier) ──────────────────────────────── */

export async function evaluateFlag(
  projectSlug: string,
  flagKey: string,
  environmentId?: string,
  clientId?: string,
): Promise<{
  key: string;
  on: boolean;
  source: 'client-override' | 'env-override' | 'project';
} | null> {
  const project = await prisma.project.findUnique({
    where: { slug: projectSlug },
    select: { id: true },
  });
  if (!project) return null;

  const flag = await prisma.flag.findUnique({
    where: { projectId_key: { projectId: project.id, key: flagKey } },
    select: { id: true, key: true, on: true },
  });
  if (!flag) return null;

  if (clientId) {
    const clientOverride = await prisma.clientFlagOverride.findUnique({
      where: { clientId_flagId: { clientId, flagId: flag.id } },
      select: { on: true },
    });
    if (clientOverride) {
      return { key: flag.key, on: clientOverride.on, source: 'client-override' };
    }
  }

  if (environmentId) {
    const envOverride = await prisma.envFlagOverride.findUnique({
      where: {
        environmentId_flagId: { environmentId, flagId: flag.id },
      },
      select: { on: true },
    });
    if (envOverride) {
      return { key: flag.key, on: envOverride.on, source: 'env-override' };
    }
  }

  return { key: flag.key, on: flag.on, source: 'project' };
}
