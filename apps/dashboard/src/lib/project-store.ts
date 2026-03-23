import { prisma } from './prisma';
import type { Project, ProjectWithCounts } from '../types/flag';

function normalizeOrigin(input: string): string | null {
  const value = input.trim();
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    return url.origin.toLowerCase();
  } catch {
    return null;
  }
}

function normalizeOrigins(values: string[] | undefined): string[] {
  if (!values) return [];
  const unique = new Set<string>();
  for (const value of values) {
    const normalized = normalizeOrigin(value);
    if (normalized) unique.add(normalized);
  }
  return Array.from(unique);
}

function serialize(row: {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
  _count?: { flags: number; environments: number };
  allowedOrigins?: { origin: string }[];
}): Project | ProjectWithCounts {
  const base: Project = {
    id: row.id,
    name: row.name,
    slug: row.slug,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    allowedOrigins: row.allowedOrigins?.map((item) => item.origin) ?? [],
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
  const row = await prisma.project.findUnique({
    where: { slug },
    include: {
      allowedOrigins: {
        select: { origin: true },
        orderBy: { origin: 'asc' },
      },
    },
  });
  return row ? (serialize(row) as Project) : null;
}

export async function createProject(data: {
  name: string;
  slug?: string;
  allowedOrigins?: string[];
}): Promise<Project | { error: string; status: number }> {
  const slug = (data.slug || data.name)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  if (!slug) return { error: 'Project name is required', status: 400 };

  const existing = await prisma.project.findUnique({ where: { slug } });
  if (existing) return { error: 'Project slug already exists', status: 409 };

  const allowedOrigins = normalizeOrigins(data.allowedOrigins);
  const row = await prisma.project.create({
    data: {
      name: data.name.trim(),
      slug,
      ...(allowedOrigins.length > 0 && {
        allowedOrigins: {
          create: allowedOrigins.map((origin) => ({ origin })),
        },
      }),
    },
    include: {
      allowedOrigins: {
        select: { origin: true },
        orderBy: { origin: 'asc' },
      },
    },
  });
  return serialize(row) as Project;
}

export async function updateProject(
  slug: string,
  data: { name?: string; allowedOrigins?: string[] },
): Promise<Project | null> {
  try {
    const row = await prisma.$transaction(async (tx) => {
      const updated = await tx.project.update({
        where: { slug },
        data: {
          ...(typeof data.name === 'string' && { name: data.name }),
        },
      });

      if (Array.isArray(data.allowedOrigins)) {
        const allowedOrigins = normalizeOrigins(data.allowedOrigins);
        await tx.projectAllowedOrigin.deleteMany({
          where: { projectId: updated.id },
        });
        if (allowedOrigins.length > 0) {
          await tx.projectAllowedOrigin.createMany({
            data: allowedOrigins.map((origin) => ({
              projectId: updated.id,
              origin,
            })),
          });
        }
      }

      return tx.project.findUnique({
        where: { id: updated.id },
        include: {
          allowedOrigins: {
            select: { origin: true },
            orderBy: { origin: 'asc' },
          },
        },
      });
    });
    return row ? (serialize(row) as Project) : null;
  } catch {
    return null;
  }
}

export async function isOriginAllowedForProject(
  projectSlug: string,
  origin: string,
): Promise<boolean> {
  const normalized = normalizeOrigin(origin);
  if (!normalized) return false;

  const match = await prisma.projectAllowedOrigin.findFirst({
    where: {
      origin: normalized,
      project: { slug: projectSlug },
    },
    select: { id: true },
  });
  return !!match;
}

export async function isOriginAllowedForAnyProject(
  origin: string,
): Promise<boolean> {
  const normalized = normalizeOrigin(origin);
  if (!normalized) return false;

  const match = await prisma.projectAllowedOrigin.findFirst({
    where: { origin: normalized },
    select: { id: true },
  });
  return !!match;
}

export async function deleteProject(slug: string): Promise<boolean> {
  try {
    await prisma.project.delete({ where: { slug } });
    return true;
  } catch {
    return false;
  }
}
