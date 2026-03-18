import { NextRequest, NextResponse } from 'next/server';
import {
  getEnvironment,
  updateEnvironment,
  deleteEnvironment,
} from '../../../../../../lib/environment-store';

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
  return NextResponse.json(env);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { slug: string; envSlug: string } },
) {
  const body = await request.json();
  const env = await updateEnvironment(params.slug, params.envSlug, body);
  if (!env) {
    return NextResponse.json(
      { error: 'Environment not found' },
      { status: 404 },
    );
  }
  return NextResponse.json(env);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { slug: string; envSlug: string } },
) {
  const deleted = await deleteEnvironment(params.slug, params.envSlug);
  if (!deleted) {
    return NextResponse.json(
      { error: 'Environment not found' },
      { status: 404 },
    );
  }
  return new NextResponse(null, { status: 204 });
}
