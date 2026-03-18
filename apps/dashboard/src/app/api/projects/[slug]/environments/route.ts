import { NextRequest, NextResponse } from 'next/server';
import {
  getEnvironments,
  createEnvironment,
} from '../../../../../lib/environment-store';

export async function GET(
  _request: NextRequest,
  { params }: { params: { slug: string } },
) {
  const envs = await getEnvironments(params.slug);
  return NextResponse.json(envs);
}

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } },
) {
  const body = await request.json();
  const result = await createEnvironment(params.slug, body);

  if ('error' in result) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status },
    );
  }

  return NextResponse.json(result, { status: 201 });
}
