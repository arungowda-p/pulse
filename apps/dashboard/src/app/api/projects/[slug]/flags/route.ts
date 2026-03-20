import { NextRequest, NextResponse } from 'next/server';
import { getFlagsForProject, createFlag } from '../../../../../lib/flags-store';
import { requireProjectAccess, requireAuth } from '../../../../../lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const auth = await requireProjectAccess(request, slug);
  if (auth instanceof NextResponse) return auth;

  const flags = await getFlagsForProject(slug);
  return NextResponse.json(flags);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const auth = await requireAuth(request, ['ADMIN', 'PROJECT_ADMIN']);
  if (auth instanceof NextResponse) return auth;

  if (auth.role === 'PROJECT_ADMIN') {
    const accessCheck = await requireProjectAccess(request, slug);
    if (accessCheck instanceof NextResponse) return accessCheck;
  }

  const body = await request.json();
  const result = await createFlag(slug, body);

  if ('error' in result) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status },
    );
  }

  return NextResponse.json(result, { status: 201 });
}
