import { NextRequest, NextResponse } from 'next/server';
import { getEnvironment } from '../../../../../../../lib/environment-store';
import { getClients, createClient } from '../../../../../../../lib/client-store';

export async function GET(
  _request: NextRequest,
  { params }: { params: { slug: string; envSlug: string } },
) {
  const env = await getEnvironment(params.slug, params.envSlug);
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
  { params }: { params: { slug: string; envSlug: string } },
) {
  const env = await getEnvironment(params.slug, params.envSlug);
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
