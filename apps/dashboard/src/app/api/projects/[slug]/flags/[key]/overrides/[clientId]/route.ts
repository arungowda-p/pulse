import { NextRequest, NextResponse } from 'next/server';
import {
  setOverride,
  removeOverride,
} from '../../../../../../../../lib/flags-store';
import { requireProjectAccess, requireClientAccess } from '../../../../../../../../lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; key: string; clientId: string }> },
) {
  const { slug, key, clientId } = await params;
  const auth = await requireClientAccess(request, clientId);
  if (auth instanceof NextResponse) {
    const projectAuth = await requireProjectAccess(request, slug);
    if (projectAuth instanceof NextResponse) return projectAuth;
  }

  const body = await request.json();
  const result = await setOverride(
    slug,
    key,
    clientId,
    !!body.on,
  );
  if (!result) {
    return NextResponse.json(
      { error: 'Flag or client not found' },
      { status: 404 },
    );
  }
  return NextResponse.json(result);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; key: string; clientId: string }> },
) {
  const { slug, key, clientId } = await params;
  const auth = await requireClientAccess(request, clientId);
  if (auth instanceof NextResponse) {
    const projectAuth = await requireProjectAccess(request, slug);
    if (projectAuth instanceof NextResponse) return projectAuth;
  }

  const removed = await removeOverride(
    slug,
    key,
    clientId,
  );
  if (!removed) {
    return NextResponse.json(
      { error: 'Override not found' },
      { status: 404 },
    );
  }
  return new NextResponse(null, { status: 204 });
}
