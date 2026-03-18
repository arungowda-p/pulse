import { prisma } from './prisma';
import type { Project, ProjectWithCounts } from '../types/flag';

function serialize(row: {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
  _count?: { flags: number; environments: number };
}): Project | ProjectWithCounts {
  const base: Project = {
    id: row.id,
    name: row.name,
    slug: row.slug,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
  if (row._count) {
    return { ...base, _count: row._count } as ProjectWithCounts;
  }
  return base;
}

export async function getAllProjects(): Promise<ProjectWithCounts[]> {
  const rows = await prisma.project.findMany({
    orderBy: { updatedAt: 'desc' },
    include: {
      _count: { select: { flags: true, environments: true } },
    },
  });
  return rows.map(serialize) as ProjectWithCounts[];
}

export async function getProject(slug: string): Promise<Project | null> {
  const row = await prisma.project.findUnique({ where: { slug } });
  return row ? (serialize(row) as Project) : null;
}

export async function createProject(data: {
  name: string;
  slug?: string;
}): Promise<Project | { error: string; status: number }> {
  const slug = (data.slug || data.name)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  if (!slug) return { error: 'Project name is required', status: 400 };

  const existing = await prisma.project.findUnique({ where: { slug } });
  if (existing) return { error: 'Project slug already exists', status: 409 };

  const row = await prisma.project.create({
    data: { name: data.name.trim(), slug },
  });
  return serialize(row) as Project;
}

export async function updateProject(
  slug: string,
  data: { name?: string },
): Promise<Project | null> {
  try {
    const row = await prisma.project.update({
      where: { slug },
      data: {
        ...(typeof data.name === 'string' && { name: data.name }),
      },
    });
    return serialize(row) as Project;
  } catch {
    return null;
  }
}

export async function deleteProject(slug: string): Promise<boolean> {
  try {
    await prisma.project.delete({ where: { slug } });
    return true;
  } catch {
    return false;
  }
}
