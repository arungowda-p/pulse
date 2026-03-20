import { NextRequest, NextResponse } from 'next/server';
import { getEnvironment } from '../../../../../../../lib/environment-store';
import { getClients, createClient } from '../../../../../../../lib/client-store';
import { requireProjectAccess, requireAuth } from '../../../../../../../lib/auth';

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
  const clients = await getClients(env.id);
  return NextResponse.json(clients);
}

export async function POST(
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

  const env = await getEnvironment(slug, envSlug);
  if (!env) {
    return NextResponse.json(
      { error: 'Environment not found' },
      { status: 404 },
    );
  }

  const body = await request.json();
  const result = await createClient(env.id, body);

  if ('error' in result) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status },
    );
  }

  return NextResponse.json(result, { status: 201 });
}
