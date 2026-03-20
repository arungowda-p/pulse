import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '../../../../../lib/auth';
import { assignClientAccess, removeClientAccess } from '../../../../../lib/user-store';

async function checkProjectAdminClientAccess(userId: string, clientId: string) {
  const { prisma } = await import('../../../../../lib/prisma');
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    include: { environment: { select: { projectId: true } } },
  });
  if (!client) return false;

  const access = await prisma.userProjectAccess.findUnique({
    where: { userId_projectId: { userId, projectId: client.environment.projectId } },
  });
  return !!access;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { userId } = await params;
  const auth = await requireAuth(request, ['ADMIN', 'PROJECT_ADMIN']);
  if (auth instanceof NextResponse) return auth;

  const { clientId } = await request.json();
  if (!clientId) {
    return NextResponse.json({ error: 'clientId is required' }, { status: 400 });
  }

  if (auth.role === 'PROJECT_ADMIN') {
    const allowed = await checkProjectAdminClientAccess(auth.id, clientId);
    if (!allowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  const result = await assignClientAccess(userId, clientId);
  if (result.error) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status },
    );
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { userId } = await params;
  const auth = await requireAuth(request, ['ADMIN', 'PROJECT_ADMIN']);
  if (auth instanceof NextResponse) return auth;

  const { clientId } = await request.json();
  if (!clientId) {
    return NextResponse.json({ error: 'clientId is required' }, { status: 400 });
  }

  if (auth.role === 'PROJECT_ADMIN') {
    const allowed = await checkProjectAdminClientAccess(auth.id, clientId);
    if (!allowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  const removed = await removeClientAccess(userId, clientId);
  if (!removed) {
    return NextResponse.json({ error: 'Access not found' }, { status: 404 });
  }

  return new NextResponse(null, { status: 204 });
}
