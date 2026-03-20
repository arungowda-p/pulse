import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '../../../../lib/auth';
import { getUserById, updateUser, deleteUser, getUserAccess } from '../../../../lib/user-store';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { userId } = await params;
  const auth = await requireAuth(request, ['ADMIN']);
  if (auth instanceof NextResponse) return auth;

  const user = await getUserById(userId);
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const access = await getUserAccess(userId);
  return NextResponse.json({ ...user, access });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { userId } = await params;
  const auth = await requireAuth(request, ['ADMIN']);
  if (auth instanceof NextResponse) return auth;

  const body = await request.json();
  const result = await updateUser(userId, body);

  if ('error' in result) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status },
    );
  }

  return NextResponse.json(result);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { userId } = await params;
  const auth = await requireAuth(request, ['ADMIN']);
  if (auth instanceof NextResponse) return auth;

  if (auth.id === userId) {
    return NextResponse.json(
      { error: 'Cannot delete your own account' },
      { status: 400 },
    );
  }

  const deleted = await deleteUser(userId);
  if (!deleted) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }
  return new NextResponse(null, { status: 204 });
}
