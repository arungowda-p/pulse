import { prisma } from './prisma';
import { hashPassword, type Role } from './auth';

export interface UserRecord {
  id: string;
  username: string;
  email: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
}

function serialize(row: {
  id: string;
  username: string;
  email: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}): UserRecord {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    role: row.role as Role,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export interface UserWithAccess extends UserRecord {
  projects: { id: string; name: string; slug: string }[];
  clients: { id: string; name: string; environmentName: string; projectName: string; projectId: string }[];
}

export interface ProjectTreeNode {
  id: string;
  name: string;
  slug: string;
  environments: {
    id: string;
    name: string;
    slug: string;
    clients: { id: string; name: string }[];
  }[];
}

export async function getAllUsers(): Promise<UserRecord[]> {
  const rows = await prisma.user.findMany({ orderBy: { createdAt: 'asc' } });
  return rows.map(serialize);
}

export async function getAllUsersWithAccess(): Promise<UserWithAccess[]> {
  const users = await prisma.user.findMany({
    include: {
      projectAccess: {
        include: { project: { select: { id: true, name: true, slug: true } } },
      },
      clientAccess: {
        include: {
          client: {
            select: {
              id: true,
              name: true,
              environment: {
                select: {
                  name: true,
                  project: { select: { id: true, name: true } },
                },
              },
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  return users.map((u) => ({
    ...serialize(u),
    projects: u.projectAccess.map((pa) => pa.project),
    clients: u.clientAccess.map((ca) => ({
      id: ca.client.id,
      name: ca.client.name,
      environmentName: ca.client.environment.name,
      projectName: ca.client.environment.project.name,
      projectId: ca.client.environment.project.id,
    })),
  }));
}

export async function getProjectTree(userId?: string, role?: string): Promise<ProjectTreeNode[]> {
  let projectFilter = {};

  if (role === 'PROJECT_ADMIN' && userId) {
    const access = await prisma.userProjectAccess.findMany({
      where: { userId },
      select: { projectId: true },
    });
    projectFilter = { id: { in: access.map((a) => a.projectId) } };
  }

  const projects = await prisma.project.findMany({
    where: projectFilter,
    include: {
      environments: {
        include: {
          clients: { select: { id: true, name: true }, orderBy: { name: 'asc' } },
        },
        orderBy: { name: 'asc' },
      },
    },
    orderBy: { name: 'asc' },
  });

  return projects.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    environments: p.environments.map((e) => ({
      id: e.id,
      name: e.name,
      slug: e.slug,
      clients: e.clients,
    })),
  }));
}

export async function getUserById(id: string): Promise<UserRecord | null> {
  const row = await prisma.user.findUnique({ where: { id } });
  return row ? serialize(row) : null;
}

export async function getUserByLogin(
  login: string,
): Promise<{ id: string; username: string; email: string; role: string; passwordHash: string } | null> {
  return prisma.user.findFirst({
    where: { OR: [{ username: login }, { email: login }] },
    select: { id: true, username: true, email: true, role: true, passwordHash: true },
  });
}

export async function createUser(data: {
  username: string;
  email: string;
  password: string;
  role?: Role;
}): Promise<UserRecord | { error: string; status: number }> {
  const username = data.username.trim().toLowerCase();
  const email = data.email.trim().toLowerCase();
  if (!username) return { error: 'Username is required', status: 400 };
  if (!email) return { error: 'Email is required', status: 400 };
  if (!data.password || data.password.length < 6) {
    return { error: 'Password must be at least 6 characters', status: 400 };
  }

  const validRoles: Role[] = ['ADMIN', 'PROJECT_ADMIN', 'CLIENT_ADMIN'];
  const role = data.role || 'CLIENT_ADMIN';
  if (!validRoles.includes(role)) {
    return { error: 'Invalid role', status: 400 };
  }

  const existing = await prisma.user.findFirst({
    where: { OR: [{ username }, { email }] },
  });
  if (existing) {
    return { error: 'Username or email already exists', status: 409 };
  }

  const passwordHash = await hashPassword(data.password);
  const row = await prisma.user.create({
    data: { username, email, passwordHash, role },
  });
  return serialize(row);
}

export async function updateUser(
  id: string,
  data: { username?: string; email?: string; password?: string; role?: Role },
): Promise<UserRecord | { error: string; status: number }> {
  const updateData: Record<string, unknown> = {};

  if (data.username !== undefined) {
    updateData.username = data.username.trim().toLowerCase();
  }
  if (data.email !== undefined) {
    updateData.email = data.email.trim().toLowerCase();
  }
  if (data.password !== undefined) {
    if (data.password.length < 6) {
      return { error: 'Password must be at least 6 characters', status: 400 };
    }
    updateData.passwordHash = await hashPassword(data.password);
  }
  if (data.role !== undefined) {
    const validRoles: Role[] = ['ADMIN', 'PROJECT_ADMIN', 'CLIENT_ADMIN'];
    if (!validRoles.includes(data.role)) {
      return { error: 'Invalid role', status: 400 };
    }
    updateData.role = data.role;
  }

  try {
    const row = await prisma.user.update({ where: { id }, data: updateData });
    return serialize(row);
  } catch {
    return { error: 'User not found', status: 404 };
  }
}

export async function deleteUser(id: string): Promise<boolean> {
  try {
    await prisma.user.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}

export async function assignProjectAccess(
  userId: string,
  projectId: string,
): Promise<{ error?: string; status?: number }> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { error: 'User not found', status: 404 };

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) return { error: 'Project not found', status: 404 };

  try {
    await prisma.userProjectAccess.upsert({
      where: { userId_projectId: { userId, projectId } },
      update: {},
      create: { userId, projectId },
    });
    return {};
  } catch {
    return { error: 'Failed to assign access', status: 500 };
  }
}

export async function removeProjectAccess(
  userId: string,
  projectId: string,
): Promise<boolean> {
  try {
    await prisma.userProjectAccess.delete({
      where: { userId_projectId: { userId, projectId } },
    });
    return true;
  } catch {
    return false;
  }
}

export async function assignClientAccess(
  userId: string,
  clientId: string,
): Promise<{ error?: string; status?: number }> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { error: 'User not found', status: 404 };

  const client = await prisma.client.findUnique({ where: { id: clientId } });
  if (!client) return { error: 'Client not found', status: 404 };

  try {
    await prisma.userClientAccess.upsert({
      where: { userId_clientId: { userId, clientId } },
      update: {},
      create: { userId, clientId },
    });
    return {};
  } catch {
    return { error: 'Failed to assign access', status: 500 };
  }
}

export async function removeClientAccess(
  userId: string,
  clientId: string,
): Promise<boolean> {
  try {
    await prisma.userClientAccess.delete({
      where: { userId_clientId: { userId, clientId } },
    });
    return true;
  } catch {
    return false;
  }
}

export async function getAccessibleProjects(userId: string, role: string) {
  if (role === 'PROJECT_ADMIN') {
    const access = await prisma.userProjectAccess.findMany({
      where: { userId },
      include: {
        project: {
          include: {
            _count: { select: { flags: true, environments: true } },
          },
        },
      },
    });
    return access.map((a) => ({
      id: a.project.id,
      name: a.project.name,
      slug: a.project.slug,
      createdAt: a.project.createdAt.toISOString(),
      updatedAt: a.project.updatedAt.toISOString(),
      _count: a.project._count,
    }));
  }

  if (role === 'CLIENT_ADMIN') {
    const access = await prisma.userClientAccess.findMany({
      where: { userId },
      include: {
        client: {
          include: {
            environment: {
              include: {
                project: {
                  include: {
                    _count: { select: { flags: true, environments: true } },
                  },
                },
              },
            },
          },
        },
      },
    });
    const seen = new Set<string>();
    return access
      .map((a) => a.client.environment.project)
      .filter((p) => {
        if (seen.has(p.id)) return false;
        seen.add(p.id);
        return true;
      })
      .map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
        _count: p._count,
      }));
  }

  return [];
}

export async function getUserAccess(userId: string) {
  const [projects, clients] = await Promise.all([
    prisma.userProjectAccess.findMany({
      where: { userId },
      include: { project: { select: { id: true, name: true, slug: true } } },
    }),
    prisma.userClientAccess.findMany({
      where: { userId },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            environment: {
              select: { id: true, name: true, slug: true, projectId: true },
            },
          },
        },
      },
    }),
  ]);
  return {
    projects: projects.map((p) => p.project),
    clients: clients.map((c) => ({
      ...c.client,
      environmentName: c.client.environment.name,
    })),
  };
}
