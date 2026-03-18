import { NextRequest, NextResponse } from 'next/server';
import { getFlagsForProject, createFlag } from '../../../../../lib/flags-store';

export async function GET(
  _request: NextRequest,
  { params }: { params: { slug: string } },
) {
  const flags = await getFlagsForProject(params.slug);
  return NextResponse.json(flags);
}

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } },
) {
  const body = await request.json();
  const result = await createFlag(params.slug, body);

  if ('error' in result) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status },
    );
  }

  return NextResponse.json(result, { status: 201 });
}
