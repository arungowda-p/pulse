import { NextRequest, NextResponse } from 'next/server';
import {
  setEnvOverride,
  removeEnvOverride,
} from '../../../../../../../../lib/flags-store';
import { requireProjectAccess } from '../../../../../../../../lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; key: string; environmentId: string }> },
) {
  const { slug, key, environmentId } = await params;
  const auth = await requireProjectAccess(request, slug);
  if (auth instanceof NextResponse) return auth;

  const body = await request.json();
  const result = await setEnvOverride(
    slug,
    key,
    environmentId,
    !!body.on,
  );
  if (!result) {
    return NextResponse.json(
      { error: 'Flag or environment not found' },
      { status: 404 },
    );
  }
  return NextResponse.json(result);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string; key: string; environmentId: string }> },
) {
  const { slug, key, environmentId } = await params;
  const auth = await requireProjectAccess(_request, slug);
  if (auth instanceof NextResponse) return auth;

  const removed = await removeEnvOverride(
    slug,
    key,
    environmentId,
  );
  if (!removed) {
    return NextResponse.json(
      { error: 'Override not found' },
      { status: 404 },
    );
  }
  return new NextResponse(null, { status: 204 });
}
