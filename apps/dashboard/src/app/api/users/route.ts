import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '../../../lib/auth';
import { getAllUsersWithAccess, createUser } from '../../../lib/user-store';

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request, ['ADMIN', 'PROJECT_ADMIN']);
  if (auth instanceof NextResponse) return auth;

  const users = await getAllUsersWithAccess();

  if (auth.role === 'PROJECT_ADMIN') {
    const { prisma } = await import('../../../lib/prisma');
    const myProjects = await prisma.userProjectAccess.findMany({
      where: { userId: auth.id },
      select: { projectId: true },
    });
    const myProjectIds = new Set(myProjects.map((p) => p.projectId));

    const filtered = users.filter(
      (u) =>
        u.projects.some((p) => myProjectIds.has(p.id)) ||
        u.clients.some((c) => myProjectIds.has(c.projectId)),
    );
    return NextResponse.json(filtered);
  }

  return NextResponse.json(users);
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request, ['ADMIN']);
  if (auth instanceof NextResponse) return auth;

  const body = await request.json();
  const result = await createUser(body);

  if ('error' in result) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status },
    );
  }

  return NextResponse.json(result, { status: 201 });
}
