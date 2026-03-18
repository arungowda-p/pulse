import { NextRequest, NextResponse } from 'next/server';
import {
  setOverride,
  removeOverride,
} from '../../../../../../../../lib/flags-store';

export async function PUT(
  request: NextRequest,
  { params }: { params: { slug: string; key: string; clientId: string } },
) {
  const body = await request.json();
  const result = await setOverride(
    params.slug,
    params.key,
    params.clientId,
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
  _request: NextRequest,
  { params }: { params: { slug: string; key: string; clientId: string } },
) {
  const removed = await removeOverride(
    params.slug,
    params.key,
    params.clientId,
  );
  if (!removed) {
    return NextResponse.json(
      { error: 'Override not found' },
      { status: 404 },
    );
  }
  return new NextResponse(null, { status: 204 });
}
