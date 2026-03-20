import { NextRequest, NextResponse } from 'next/server';
import {
  getEnvironments,
  createEnvironment,
} from '../../../../../lib/environment-store';
import { requireProjectAccess, requireAuth } from '../../../../../lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const auth = await requireProjectAccess(request, slug);
  if (auth instanceof NextResponse) return auth;

  const envs = await getEnvironments(slug);
  return NextResponse.json(envs);
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
  const result = await createEnvironment(slug, body);

  if ('error' in result) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status },
    );
  }

  return NextResponse.json(result, { status: 201 });
}
