import { NextRequest, NextResponse } from 'next/server';
import {
  getEnvironment,
  updateEnvironment,
  deleteEnvironment,
} from '../../../../../../lib/environment-store';
import { requireProjectAccess, requireAuth } from '../../../../../../lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; envSlug: string }> },
) {
  const { slug, envSlug } = await params;
  const auth = await requireProjectAccess(request, slug);
  if (auth instanceof NextResponse) return auth;

  const env = await getEnvironment(slug, envSlug);
  if (!env) {
    return NextResponse.json(
      { error: 'Environment not found' },
      { status: 404 },
    );
  }
  return NextResponse.json(env);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; envSlug: string }> },
) {
  const { slug, envSlug } = await params;
  const auth = await requireAuth(request, ['ADMIN', 'PROJECT_ADMIN']);
  if (auth instanceof NextResponse) return auth;

  if (auth.role === 'PROJECT_ADMIN') {
    const accessCheck = await requireProjectAccess(request, slug);
    if (accessCheck instanceof NextResponse) return accessCheck;
  }

  const body = await request.json();
  const env = await updateEnvironment(slug, envSlug, body);
  if (!env) {
    return NextResponse.json(
      { error: 'Environment not found' },
      { status: 404 },
    );
  }
  return NextResponse.json(env);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; envSlug: string }> },
) {
  const { slug, envSlug } = await params;
  const auth = await requireAuth(request, ['ADMIN', 'PROJECT_ADMIN']);
  if (auth instanceof NextResponse) return auth;

  if (auth.role === 'PROJECT_ADMIN') {
    const accessCheck = await requireProjectAccess(request, slug);
    if (accessCheck instanceof NextResponse) return accessCheck;
  }

  const deleted = await deleteEnvironment(slug, envSlug);
  if (!deleted) {
    return NextResponse.json(
      { error: 'Environment not found' },
      { status: 404 },
    );
  }
  return new NextResponse(null, { status: 204 });
}
