import { NextRequest, NextResponse } from 'next/server';
import {
  getFlag,
  updateFlag,
  deleteFlag,
} from '../../../../../../lib/flags-store';
import { requireProjectAccess, requireAuth } from '../../../../../../lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; key: string }> },
) {
  const { slug, key } = await params;
  const auth = await requireProjectAccess(request, slug);
  if (auth instanceof NextResponse) return auth;

  const flag = await getFlag(slug, key);
  if (!flag) {
    return NextResponse.json({ error: 'Flag not found' }, { status: 404 });
  }
  return NextResponse.json(flag);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; key: string }> },
) {
  const { slug, key } = await params;
  const auth = await requireAuth(request, ['ADMIN', 'PROJECT_ADMIN']);
  if (auth instanceof NextResponse) return auth;

  if (auth.role === 'PROJECT_ADMIN') {
    const accessCheck = await requireProjectAccess(request, slug);
    if (accessCheck instanceof NextResponse) return accessCheck;
  }

  const body = await request.json();
  const flag = await updateFlag(slug, key, body);
  if (!flag) {
    return NextResponse.json({ error: 'Flag not found' }, { status: 404 });
  }
  return NextResponse.json(flag);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; key: string }> },
) {
  const { slug, key } = await params;
  const auth = await requireAuth(request, ['ADMIN', 'PROJECT_ADMIN']);
  if (auth instanceof NextResponse) return auth;

  if (auth.role === 'PROJECT_ADMIN') {
    const accessCheck = await requireProjectAccess(request, slug);
    if (accessCheck instanceof NextResponse) return accessCheck;
  }

  const deleted = await deleteFlag(slug, key);
  if (!deleted) {
    return NextResponse.json({ error: 'Flag not found' }, { status: 404 });
  }
  return new NextResponse(null, { status: 204 });
}
