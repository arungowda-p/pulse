import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '../../../../../lib/auth';
import { assignProjectAccess, removeProjectAccess } from '../../../../../lib/user-store';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { userId } = await params;
  const auth = await requireAuth(request, ['ADMIN']);
  if (auth instanceof NextResponse) return auth;

  const { projectId } = await request.json();
  if (!projectId) {
    return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
  }

  const result = await assignProjectAccess(userId, projectId);
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
  const auth = await requireAuth(request, ['ADMIN']);
  if (auth instanceof NextResponse) return auth;

  const { projectId } = await request.json();
  if (!projectId) {
    return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
  }

  const removed = await removeProjectAccess(userId, projectId);
  if (!removed) {
    return NextResponse.json({ error: 'Access not found' }, { status: 404 });
  }

  return new NextResponse(null, { status: 204 });
}
