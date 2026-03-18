import { prisma } from './prisma';
import type { Environment } from '../types/flag';

function serialize(row: {
  id: string;
  name: string;
  slug: string;
  projectId: string;
  createdAt: Date;
  updatedAt: Date;
}): Environment {
  return {
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function getEnvironments(
  projectSlug: string,
): Promise<Environment[]> {
  const project = await prisma.project.findUnique({
    where: { slug: projectSlug },
    select: { id: true },
  });
  if (!project) return [];

  const rows = await prisma.environment.findMany({
    where: { projectId: project.id },
    orderBy: { name: 'asc' },
  });
  return rows.map(serialize);
}

export async function getEnvironment(
  projectSlug: string,
  envSlug: string,
): Promise<Environment | null> {
  const project = await prisma.project.findUnique({
    where: { slug: projectSlug },
    select: { id: true },
  });
  if (!project) return null;

  const row = await prisma.environment.findUnique({
    where: { projectId_slug: { projectId: project.id, slug: envSlug } },
  });
  return row ? serialize(row) : null;
}

export async function createEnvironment(
  projectSlug: string,
  data: { name: string; slug?: string },
): Promise<Environment | { error: string; status: number }> {
  const name = (data.name || '').trim();
  if (!name) return { error: 'Environment name is required', status: 400 };

  const slug = (data.slug || name)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  if (!slug) return { error: 'Invalid environment name', status: 400 };

  const project = await prisma.project.findUnique({
    where: { slug: projectSlug },
    select: { id: true },
  });
  if (!project) return { error: 'Project not found', status: 404 };

  const existing = await prisma.environment.findUnique({
    where: { projectId_slug: { projectId: project.id, slug } },
  });
  if (existing)
    return {
      error: 'Environment slug already exists in this project',
      status: 409,
    };

  const row = await prisma.environment.create({
    data: { name, slug, projectId: project.id },
  });
  return serialize(row);
}

export async function updateEnvironment(
  projectSlug: string,
  envSlug: string,
  data: { name?: string },
): Promise<Environment | null> {
  const project = await prisma.project.findUnique({
    where: { slug: projectSlug },
    select: { id: true },
  });
  if (!project) return null;

  try {
    const row = await prisma.environment.update({
      where: { projectId_slug: { projectId: project.id, slug: envSlug } },
      data: {
        ...(typeof data.name === 'string' && { name: data.name }),
      },
    });
    return serialize(row);
  } catch {
    return null;
  }
}

export async function deleteEnvironment(
  projectSlug: string,
  envSlug: string,
): Promise<boolean> {
  const project = await prisma.project.findUnique({
    where: { slug: projectSlug },
    select: { id: true },
  });
  if (!project) return false;

  try {
    await prisma.environment.delete({
      where: { projectId_slug: { projectId: project.id, slug: envSlug } },
    });
    return true;
  } catch {
    return false;
  }
}
